import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { cashRegisterSessionSchema, locationSchema, userLocationSchema } from '@/models/Schema';

// GET /api/caja/status — returns the open session for the current user (or null)
export async function GET() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve locationId for context
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
    if (!assignment) {
      return NextResponse.json({ session: null, locationId: null });
    }
    locationId = assignment.locationId;
  }

  if (!locationId) {
    return NextResponse.json({ session: null, locationId: null });
  }

  // Find open session for THIS USER (not location-wide)
  const [session] = await db
    .select()
    .from(cashRegisterSessionSchema)
    .where(
      and(
        eq(cashRegisterSessionSchema.userId, userId),
        eq(cashRegisterSessionSchema.status, 'open'),
      ),
    )
    .limit(1);

  // Warning if session is approaching auto-close (>8 hours)
  let warningAutoClose = false;
  if (session) {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
    warningAutoClose = session.openedAt <= eightHoursAgo;
  }

  return NextResponse.json({ session: session ?? null, locationId, warningAutoClose });
}
