import { auth } from '@clerk/nextjs/server';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  customerSchema,
  loyaltyConfigSchema,
  loyaltyRewardSchema,
  loyaltyTransactionSchema,
} from '@/models/Schema';

// GET /api/loyalty/customer/:customerId
// Devuelve puntos disponibles, historial de movimientos y premios aplicables.
export async function GET(
  _request: Request,
  { params }: { params: { customerId: string } },
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customerId = Number(params.customerId);
  if (Number.isNaN(customerId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  // Carga en paralelo: cliente, config, balance de puntos, historial, premios
  const [customerRows, configRows, balanceRows, transactions, rewards] = await Promise.all([
    // Verificar que el cliente pertenece a la org
    db.select({ id: customerSchema.id, name: customerSchema.name, email: customerSchema.email, whatsapp: customerSchema.whatsapp })
      .from(customerSchema)
      .where(and(eq(customerSchema.id, customerId), eq(customerSchema.organizationId, orgId)))
      .limit(1),

    // Config del programa
    db.select().from(loyaltyConfigSchema).where(eq(loyaltyConfigSchema.organizationId, orgId)),

    // Balance = SUM de todos los movimientos del cliente
    db.select({ balance: sql<number>`COALESCE(SUM(${loyaltyTransactionSchema.points}), 0)` })
      .from(loyaltyTransactionSchema)
      .where(and(
        eq(loyaltyTransactionSchema.customerId, customerId),
        eq(loyaltyTransactionSchema.organizationId, orgId),
      )),

    // Últimos 30 movimientos
    db.select()
      .from(loyaltyTransactionSchema)
      .where(and(
        eq(loyaltyTransactionSchema.customerId, customerId),
        eq(loyaltyTransactionSchema.organizationId, orgId),
      ))
      .orderBy(desc(loyaltyTransactionSchema.createdAt))
      .limit(30),

    // Premios activos de la org (todos, para filtrar por puntos en el cliente)
    db.select({
      id: loyaltyRewardSchema.id,
      name: loyaltyRewardSchema.name,
      description: loyaltyRewardSchema.description,
      type: loyaltyRewardSchema.type,
      pointsCost: loyaltyRewardSchema.pointsCost,
      discountValue: loyaltyRewardSchema.discountValue,
      productId: loyaltyRewardSchema.productId,
      stock: loyaltyRewardSchema.stock,
    })
      .from(loyaltyRewardSchema)
      .where(and(
        eq(loyaltyRewardSchema.organizationId, orgId),
        eq(loyaltyRewardSchema.isActive, true),
      ))
      .orderBy(asc(loyaltyRewardSchema.pointsCost)),
  ]);

  const customer = customerRows[0];
  if (!customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  const config = configRows[0] ?? null;
  const balance = Number(balanceRows[0]?.balance ?? 0);
  const minPointsToRedeem = config?.minPointsToRedeem ?? 0;

  // Premios que el cliente puede canjear con sus puntos actuales
  const affordableRewards = rewards.filter(
    r => balance >= r.pointsCost && balance >= minPointsToRedeem,
  );

  return NextResponse.json({
    customer,
    config,
    balance,
    transactions,
    affordableRewards,
  });
}
