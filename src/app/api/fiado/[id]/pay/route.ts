import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  customerSchema,
  debtTransactionSchema,
  locationSchema,
  userLocationSchema,
} from '@/models/Schema';

// POST /api/fiado/[id]/pay — register a payment from a customer (reduces their debt)
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customerId = Number(params.id);
  const body = await request.json();
  const { amount, description, locationId: bodyLocationId } = body;

  if (!amount || Number(amount) <= 0) {
    return NextResponse.json({ error: 'amount es requerido y debe ser mayor a 0' }, { status: 400 });
  }

  // Resolve locationId
  let resolvedLocationId: number;
  if (orgRole === 'org:admin' && bodyLocationId) {
    resolvedLocationId = Number(bodyLocationId);
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
        eq(customerSchema.id, customerId),
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
      customerId,
      customerName: customer.name,
      type: 'payment',
      amount: String(amount),
      description: description || 'Pago de deuda',
      userId,
    })
    .returning();

  return NextResponse.json(tx, { status: 201 });
}
