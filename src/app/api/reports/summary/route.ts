import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  debtTransactionSchema,
  expenseSchema,
  saleItemSchema,
  saleSchema,
  userLocationSchema,
} from '@/models/Schema';

// GET /api/reports/summary?period=today|week|month
export async function GET(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'today';

  // Date range
  const now = new Date();
  let from: Date;
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  if (period === 'today') {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    from = new Date(now);
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else {
    // month
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Resolve locationId for non-admins
  let locationId: number | null = null;
  if (orgRole !== 'org:admin') {
    const [assignment] = await db
      .select({ locationId: userLocationSchema.locationId })
      .from(userLocationSchema)
      .where(eq(userLocationSchema.userId, userId));
    if (!assignment) {
      return NextResponse.json({ error: 'Sin local asignado' }, { status: 403 });
    }
    locationId = assignment.locationId;
  }

  // Base sale condition
  const saleConditions = [
    eq(saleSchema.organizationId, orgId),
    eq(saleSchema.status, 'completed'),
    gte(saleSchema.createdAt, from),
    lte(saleSchema.createdAt, to),
  ];
  if (locationId) {
    saleConditions.push(eq(saleSchema.locationId, locationId));
  }

  // 1. Sales totals
  const [salesTotals] = await db
    .select({
      count: sql<string>`COUNT(*)`,
      total: sql<string>`COALESCE(SUM(${saleSchema.total}::numeric), 0)`,
      totalCash: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} = 'cash' THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
      totalTransfer: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} = 'transfer' THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
      totalCard: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} IN ('debit','credit') THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
    })
    .from(saleSchema)
    .where(and(...saleConditions));

  // 2. Top 10 products by quantity sold in period
  const saleIds = await db
    .select({ id: saleSchema.id })
    .from(saleSchema)
    .where(and(...saleConditions));

  const saleIdList = saleIds.map(s => s.id);

  let topProducts: { productName: string; totalQty: string; totalRevenue: string }[] = [];
  if (saleIdList.length > 0) {
    topProducts = await db
      .select({
        productName: saleItemSchema.productName,
        totalQty: sql<string>`SUM(${saleItemSchema.quantity})`,
        totalRevenue: sql<string>`SUM(${saleItemSchema.subtotal}::numeric)`,
      })
      .from(saleItemSchema)
      .where(sql`${saleItemSchema.saleId} = ANY(ARRAY[${sql.join(saleIdList.map(id => sql`${id}`), sql`, `)}]::int[])`)
      .groupBy(saleItemSchema.productName)
      .orderBy(desc(sql`SUM(${saleItemSchema.quantity})`))
      .limit(10);
  }

  // 3. Total fiado outstanding (all time, scoped to org/location)
  const debtConditions = [eq(debtTransactionSchema.organizationId, orgId)];
  if (locationId) {
    debtConditions.push(eq(debtTransactionSchema.locationId, locationId));
  }

  const [debtTotals] = await db
    .select({
      totalDebt: sql<string>`COALESCE(SUM(CASE WHEN ${debtTransactionSchema.type} = 'charge' THEN ${debtTransactionSchema.amount}::numeric ELSE -${debtTransactionSchema.amount}::numeric END), 0)`,
      debtorCount: sql<string>`COUNT(DISTINCT ${debtTransactionSchema.customerId})`,
    })
    .from(debtTransactionSchema)
    .where(and(...debtConditions));

  // 4. Expenses in period
  const expenseConditions = [
    eq(expenseSchema.organizationId, orgId),
    gte(expenseSchema.date, from),
    lte(expenseSchema.date, to),
  ];
  if (locationId) {
    expenseConditions.push(eq(expenseSchema.locationId, locationId));
  }

  const [expenseTotals] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenseSchema.amount}::numeric), 0)`,
      count: sql<string>`COUNT(*)`,
    })
    .from(expenseSchema)
    .where(and(...expenseConditions));

  // 5. Net profit estimate (revenue - expenses, not accounting for COGS)
  const revenue = Number(salesTotals?.total ?? 0);
  const expenses = Number(expenseTotals?.total ?? 0);
  const netProfit = revenue - expenses;

  return NextResponse.json({
    period,
    from: from.toISOString(),
    to: to.toISOString(),
    sales: {
      count: Number(salesTotals?.count ?? 0),
      total: revenue,
      totalCash: Number(salesTotals?.totalCash ?? 0),
      totalTransfer: Number(salesTotals?.totalTransfer ?? 0),
      totalCard: Number(salesTotals?.totalCard ?? 0),
    },
    expenses: {
      total: expenses,
      count: Number(expenseTotals?.count ?? 0),
    },
    netProfit,
    topProducts,
    fiado: {
      totalDebt: Number(debtTotals?.totalDebt ?? 0),
      debtorCount: Number(debtTotals?.debtorCount ?? 0),
    },
  });
}
