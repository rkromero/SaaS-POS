import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  cashRegisterSessionSchema,
  locationSchema,
  userLocationSchema,
} from '@/models/Schema';

// POST /api/caja/open — open a cash register session for the caller's location
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { openingBalance, locationId: bodyLocationId } = body;

  if (openingBalance === undefined || openingBalance === null) {
    return NextResponse.json({ error: 'openingBalance es requerido' }, { status: 400 });
  }

  // Resolve locationId
  let resolvedLocationId: number;
  if (orgRole === 'org:admin') {
    if (bodyLocationId) {
      resolvedLocationId = Number(bodyLocationId);
    } else {
      // Admin without explicit locationId: use the first location of the org
      const [loc] = await db
        .select({ id: locationSchema.id })
        .from(locationSchema)
        .where(eq(locationSchema.organizationId, orgId))
        .limit(1);
      if (!loc) {
        return NextResponse.json({ error: 'No hay locales configurados' }, { status: 403 });
      }
      resolvedLocationId = loc.id;
    }
  } else {
    const [assignment] = await db
      .select({ locationId: userLocationSchema.locationId })
      .from(userLocationSchema)
      .where(eq(userLocationSchema.userId, userId));
    if (!assignment) {
      return NextResponse.json({ error: 'Sin local asignado' }, { status: 403 });
    }
    resolvedLocationId = assignment.locationId;
  }

  // Validate location belongs to org
  const [location] = await db
    .select()
    .from(locationSchema)
    .where(
      and(
        eq(locationSchema.id, resolvedLocationId),
        eq(locationSchema.organizationId, orgId),
      ),
    );
  if (!location) {
    return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
  }

  // Check no open session already exists
  const [existing] = await db
    .select()
    .from(cashRegisterSessionSchema)
    .where(
      and(
        eq(cashRegisterSessionSchema.locationId, resolvedLocationId),
        eq(cashRegisterSessionSchema.status, 'open'),
      ),
    );
  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe una caja abierta para este local' },
      { status: 409 },
    );
  }

  const [session] = await db
    .insert(cashRegisterSessionSchema)
    .values({
      locationId: resolvedLocationId,
      userId,
      openingBalance: String(openingBalance),
      status: 'open',
    })
    .returning();

  return NextResponse.json(session, { status: 201 });
}
