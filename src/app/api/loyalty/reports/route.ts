import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  customerSchema,
  loyaltyRedemptionSchema,
  loyaltyTransactionSchema,
} from '@/models/Schema';

// GET /api/loyalty/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
// Resumen del programa: puntos emitidos, canjeados, clientes más activos.
export async function GET(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Solo administradores pueden ver reportes' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);

  const dateConditions = [
    eq(loyaltyTransactionSchema.organizationId, orgId),
    gte(loyaltyTransactionSchema.createdAt, fromDate),
    lte(loyaltyTransactionSchema.createdAt, toDate),
  ];

  const [totals, topCustomers, recentRedemptions] = await Promise.all([
    // Puntos emitidos y canjeados en el rango
    db.select({
      totalEarned: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactionSchema.points} > 0 THEN ${loyaltyTransactionSchema.points} ELSE 0 END), 0)`,
      totalRedeemed: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactionSchema.points} < 0 THEN ABS(${loyaltyTransactionSchema.points}) ELSE 0 END), 0)`,
      uniqueCustomers: sql<number>`COUNT(DISTINCT ${loyaltyTransactionSchema.customerId})`,
    })
      .from(loyaltyTransactionSchema)
      .where(and(...dateConditions)),

    // Top 10 clientes por puntos acumulados (balance total histórico, no por rango)
    db.select({
      customerId: loyaltyTransactionSchema.customerId,
      customerName: customerSchema.name,
      customerWhatsapp: customerSchema.whatsapp,
      totalPoints: sql<number>`COALESCE(SUM(${loyaltyTransactionSchema.points}), 0)`,
      totalEarned: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactionSchema.points} > 0 THEN ${loyaltyTransactionSchema.points} ELSE 0 END), 0)`,
    })
      .from(loyaltyTransactionSchema)
      .innerJoin(customerSchema, eq(loyaltyTransactionSchema.customerId, customerSchema.id))
      .where(eq(loyaltyTransactionSchema.organizationId, orgId))
      .groupBy(loyaltyTransactionSchema.customerId, customerSchema.name, customerSchema.whatsapp)
      .orderBy(desc(sql`COALESCE(SUM(${loyaltyTransactionSchema.points}), 0)`))
      .limit(10),

    // Últimos 20 canjes en el rango
    db.select({
      id: loyaltyRedemptionSchema.id,
      customerName: loyaltyRedemptionSchema.customerName,
      rewardName: loyaltyRedemptionSchema.rewardName,
      pointsSpent: loyaltyRedemptionSchema.pointsSpent,
      discountApplied: loyaltyRedemptionSchema.discountApplied,
      status: loyaltyRedemptionSchema.status,
      createdAt: loyaltyRedemptionSchema.createdAt,
    })
      .from(loyaltyRedemptionSchema)
      .where(and(
        eq(loyaltyRedemptionSchema.organizationId, orgId),
        gte(loyaltyRedemptionSchema.createdAt, fromDate),
        lte(loyaltyRedemptionSchema.createdAt, toDate),
      ))
      .orderBy(desc(loyaltyRedemptionSchema.createdAt))
      .limit(20),
  ]);

  return NextResponse.json({
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    totals: totals[0] ?? { totalEarned: 0, totalRedeemed: 0, uniqueCustomers: 0 },
    topCustomers,
    recentRedemptions,
  });
}
