import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { customerSchema, debtTransactionSchema } from '@/models/Schema';

// GET /api/fiado/[id]/transactions — full transaction history for a customer
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customerId = Number(params.id);

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

  const transactions = await db
    .select()
    .from(debtTransactionSchema)
    .where(eq(debtTransactionSchema.customerId, customerId))
    .orderBy(desc(debtTransactionSchema.createdAt));

  return NextResponse.json(transactions);
}
