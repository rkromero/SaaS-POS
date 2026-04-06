import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { cashRegisterSessionSchema, userLocationSchema } from '@/models/Schema';

// GET /api/caja/status — returns the open session for the caller's location (or null)
export async function GET() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let locationId: number | null = null;
  if (orgRole !== 'org:admin') {
    const [assignment] = await db
      .select({ locationId: userLocationSchema.locationId })
      .from(userLocationSchema)
      .where(eq(userLocationSchema.userId, userId));
    if (!assignment) {
      return NextResponse.json({ session: null, locationId: null });
    }
    locationId = assignment.locationId;
  }

  const query = db
    .select()
    .from(cashRegisterSessionSchema)
    .orderBy(desc(cashRegisterSessionSchema.openedAt))
    .limit(1);

  const results = locationId
    ? await query.where(
      and(
        eq(cashRegisterSessionSchema.locationId, locationId),
        eq(cashRegisterSessionSchema.status, 'open'),
      ),
    )
    : await query;

  const session = results[0] ?? null;
  return NextResponse.json({ session, locationId });
}
