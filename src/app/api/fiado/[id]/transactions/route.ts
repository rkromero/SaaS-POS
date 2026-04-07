import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { customerSchema, debtTransactionSchema, userLocationSchema } from '@/models/Schema';

// GET /api/fiado/[id]/transactions — full transaction history for a customer
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customerId = Number(params.id);
  const { searchParams } = new URL(request.url);
  const locationIdParam = searchParams.get('locationId');

  // Verify customer belongs to org
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

  // Resolve locationId filter
  let locationId: number | null = null;
  if (orgRole === 'org:admin') {
    if (locationIdParam) {
      locationId = Number(locationIdParam);
    }
    // If no locationId param, admin sees all transactions for that customer
  } else {
    const [assignment] = await db
      .select({ locationId: userLocationSchema.locationId })
      .from(userLocationSchema)
      .where(eq(userLocationSchema.userId, userId));
    if (!assignment) {
      return NextResponse.json({ error: 'Sin local asignado' }, { status: 403 });
    }
    locationId = assignment.locationId;
  }

  const whereCondition = locationId
    ? and(
        eq(debtTransactionSchema.customerId, customerId),
        eq(debtTransactionSchema.locationId, locationId),
      )
    : eq(debtTransactionSchema.customerId, customerId);

  const transactions = await db
    .select()
    .from(debtTransactionSchema)
    .where(whereCondition)
    .orderBy(desc(debtTransactionSchema.createdAt));

  return NextResponse.json(transactions);
}
