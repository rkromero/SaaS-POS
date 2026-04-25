import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { cashRegisterSessionSchema, locationSchema, userLocationSchema } from '@/models/Schema';

// GET /api/caja/history?limit=20&offset=0&userId=X (userId filter admin-only)
export async function GET(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);
  const offset = Number(searchParams.get('offset') ?? 0);
  const filterUserId = searchParams.get('userId');

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

  // Build where conditions
  const conditions = [
    eq(cashRegisterSessionSchema.locationId, locationId),
    // Show closed and auto_closed sessions (not open)
    ne(cashRegisterSessionSchema.status, 'open'),
  ];

  // Non-admins only see their own sessions
  if (orgRole !== 'org:admin') {
    conditions.push(eq(cashRegisterSessionSchema.userId, userId));
  } else if (filterUserId) {
    // Admin can filter by a specific user
    conditions.push(eq(cashRegisterSessionSchema.userId, filterUserId));
  }

  const sessions = await db
    .select()
    .from(cashRegisterSessionSchema)
    .where(and(...conditions))
    .orderBy(desc(cashRegisterSessionSchema.openedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ sessions });
}
