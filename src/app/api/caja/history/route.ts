import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { cashRegisterSessionSchema, locationSchema, userLocationSchema } from '@/models/Schema';

// GET /api/caja/history?limit=20&offset=0
export async function GET(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);
  const offset = Number(searchParams.get('offset') ?? 0);

  let locationId: number | null = null;

  if (orgRole === 'org:admin') {
    const [loc] = await db
      .select({ id: locationSchema.id })
      .from(locationSchema)
      .where(eq(locationSchema.organizationId, orgId))
      .limit(1);
    locationId = loc?.id ?? null;
  } else {
    const [assignment] = await db
      .select({ locationId: userLocationSchema.locationId })
      .from(userLocationSchema)
      .where(eq(userLocationSchema.userId, userId));
    locationId = assignment?.locationId ?? null;
  }

  if (!locationId) {
    return NextResponse.json({ sessions: [], total: 0 });
  }

  const sessions = await db
    .select()
    .from(cashRegisterSessionSchema)
    .where(
      and(
        eq(cashRegisterSessionSchema.locationId, locationId),
        eq(cashRegisterSessionSchema.status, 'closed'),
      ),
    )
    .orderBy(desc(cashRegisterSessionSchema.openedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ sessions });
}
