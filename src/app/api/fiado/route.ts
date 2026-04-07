import { auth } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  customerSchema,
  debtTransactionSchema,
  locationSchema,
  userLocationSchema,
} from '@/models/Schema';

// GET /api/fiado — list all customers with their debt balance for the caller's location
export async function GET(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locationIdParam = searchParams.get('locationId');

  // Resolve locationId
  let locationId: number | null = null;
  if (orgRole === 'org:admin') {
    if (locationIdParam) {
      locationId = Number(locationIdParam);
    }
    // If no locationId param, admins see all locations aggregated
    const joinCondition = locationId
      ? and(
          eq(debtTransactionSchema.customerId, customerSchema.id),
          eq(debtTransactionSchema.locationId, locationId),
        )
      : eq(debtTransactionSchema.customerId, customerSchema.id);

    const customers = await db
      .select({
        id: customerSchema.id,
        name: customerSchema.name,
        whatsapp: customerSchema.whatsapp,
        email: customerSchema.email,
        balance: sql<string>`
          COALESCE(SUM(
            CASE WHEN ${debtTransactionSchema.type} = 'charge' THEN ${debtTransactionSchema.amount}::numeric
                 WHEN ${debtTransactionSchema.type} = 'payment' THEN -${debtTransactionSchema.amount}::numeric
                 ELSE 0
            END
          ), 0)
        `.as('balance'),
      })
      .from(customerSchema)
      .leftJoin(debtTransactionSchema, joinCondition)
      .where(eq(customerSchema.organizationId, orgId))
      .groupBy(customerSchema.id)
      .orderBy(customerSchema.name);

    return NextResponse.json(customers);
  }

  // Regular user — find their assigned location
  const [assignment] = await db
    .select({ locationId: userLocationSchema.locationId })
    .from(userLocationSchema)
    .where(eq(userLocationSchema.userId, userId));

  if (!assignment) {
    return NextResponse.json(
      { error: 'Sin local asignado' },
      { status: 403 },
    );
  }
  locationId = assignment.locationId;

  const customers = await db
    .select({
      id: customerSchema.id,
      name: customerSchema.name,
      whatsapp: customerSchema.whatsapp,
      email: customerSchema.email,
      balance: sql<string>`
        COALESCE(SUM(
          CASE WHEN ${debtTransactionSchema.type} = 'charge' THEN ${debtTransactionSchema.amount}::numeric
               WHEN ${debtTransactionSchema.type} = 'payment' THEN -${debtTransactionSchema.amount}::numeric
               ELSE 0
          END
        ), 0)
      `.as('balance'),
    })
    .from(customerSchema)
    .leftJoin(
      debtTransactionSchema,
      and(
        eq(debtTransactionSchema.customerId, customerSchema.id),
        eq(debtTransactionSchema.locationId, locationId),
      ),
    )
    .where(eq(customerSchema.organizationId, orgId))
    .groupBy(customerSchema.id)
    .orderBy(customerSchema.name);

  return NextResponse.json(customers);
}

// POST /api/fiado — register a charge (fiado) for a customer
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { customerId, amount, description, locationId: bodyLocationId } = body;

  if (!customerId || !amount || Number(amount) <= 0) {
    return NextResponse.json(
      { error: 'customerId y amount son requeridos' },
      { status: 400 },
    );
  }

  // Resolve locationId
  let resolvedLocationId: number;
  if (orgRole === 'org:admin') {
    if (bodyLocationId) {
      resolvedLocationId = Number(bodyLocationId);
    } else {
      const [firstLocation] = await db
        .select({ id: locationSchema.id })
        .from(locationSchema)
        .where(
          and(
            eq(locationSchema.organizationId, orgId),
            eq(locationSchema.isActive, true),
          ),
        )
        .limit(1);
      if (!firstLocation) {
        return NextResponse.json({ error: 'No hay locales activos' }, { status: 400 });
      }
      resolvedLocationId = firstLocation.id;
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

  // Validate customer belongs to org
  const [customer] = await db
    .select()
    .from(customerSchema)
    .where(
      and(
        eq(customerSchema.id, Number(customerId)),
        eq(customerSchema.organizationId, orgId),
      ),
    );

  if (!customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
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

  const [tx] = await db
    .insert(debtTransactionSchema)
    .values({
      organizationId: orgId,
      locationId: resolvedLocationId,
      customerId: Number(customerId),
      customerName: customer.name,
      type: 'charge',
      amount: String(amount),
      description: description || null,
      userId,
    })
    .returning();

  return NextResponse.json(tx, { status: 201 });
}
