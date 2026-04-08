import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { cashRegisterSessionSchema, locationSchema, userLocationSchema } from '@/models/Schema';

// GET /api/caja/status — returns the open session for the caller's location (or null)
export async function GET() {
  try {
    return await handler();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Internal: ${msg}` }, { status: 500 });
  }
}

async function handler() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let locationId: number | null = null;

  if (orgRole === 'org:admin') {
    // Admins: use the first location of the org so they can open/close caja
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
    if (!assignment) {
      return NextResponse.json({ session: null, locationId: null });
    }
    locationId = assignment.locationId;
  }

  if (!locationId) {
    return NextResponse.json({ session: null, locationId: null });
  }

  const [session] = await db
    .select()
    .from(cashRegisterSessionSchema)
    .where(
      and(
        eq(cashRegisterSessionSchema.locationId, locationId),
        eq(cashRegisterSessionSchema.status, 'open'),
      ),
    )
    .orderBy(desc(cashRegisterSessionSchema.openedAt))
    .limit(1);

  return NextResponse.json({ session: session ?? null, locationId });
}
