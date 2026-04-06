import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  locationSchema,
  productSchema,
  saleItemSchema,
  saleSchema,
  stockSchema,
} from '@/models/Schema';

// GET /api/dashboard/metrics — key metrics for the dashboard
export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Sales today
  const salesToday = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${saleSchema.total}::numeric), 0)`,
    })
    .from(saleSchema)
    .where(
      and(
        eq(saleSchema.organizationId, orgId),
        eq(saleSchema.status, 'completed'),
        gte(saleSchema.createdAt, today),
      ),
    );

  // Sales this month
  const salesMonth = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${saleSchema.total}::numeric), 0)`,
    })
    .from(saleSchema)
    .where(
      and(
        eq(saleSchema.organizationId, orgId),
        eq(saleSchema.status, 'completed'),
        gte(saleSchema.createdAt, thisMonthStart),
      ),
    );

  // Revenue by payment method (this month)
  const revenueByPayment = await db
    .select({
      paymentMethod: saleSchema.paymentMethod,
      total: sql<number>`coalesce(sum(${saleSchema.total}::numeric), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(saleSchema)
    .where(
      and(
        eq(saleSchema.organizationId, orgId),
        eq(saleSchema.status, 'completed'),
        gte(saleSchema.createdAt, thisMonthStart),
      ),
    )
    .groupBy(saleSchema.paymentMethod);

  // Top 5 best-selling products (this month)
  const topProducts = await db
    .select({
      productName: saleItemSchema.productName,
      totalQty: sql<number>`sum(${saleItemSchema.quantity})`,
      totalRevenue: sql<number>`sum(${saleItemSchema.subtotal}::numeric)`,
    })
    .from(saleItemSchema)
    .innerJoin(saleSchema, eq(saleItemSchema.saleId, saleSchema.id))
    .where(
      and(
        eq(saleSchema.organizationId, orgId),
        eq(saleSchema.status, 'completed'),
        gte(saleSchema.createdAt, thisMonthStart),
      ),
    )
    .groupBy(saleItemSchema.productName)
    .orderBy(desc(sql`sum(${saleItemSchema.quantity})`))
    .limit(5);

  // Low stock alerts across all locations
  const lowStock = await db
    .select({
      productName: productSchema.name,
      locationName: locationSchema.name,
      quantity: stockSchema.quantity,
      threshold: stockSchema.lowStockThreshold,
    })
    .from(stockSchema)
    .innerJoin(productSchema, eq(stockSchema.productId, productSchema.id))
    .innerJoin(locationSchema, eq(stockSchema.locationId, locationSchema.id))
    .where(
      and(
        eq(locationSchema.organizationId, orgId),
        eq(productSchema.isActive, true),
        sql`${stockSchema.quantity} <= ${stockSchema.lowStockThreshold}`,
      ),
    )
    .orderBy(stockSchema.quantity)
    .limit(10);

  // Last 7 days sales trend
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const salesTrend = await db
    .select({
      date: sql<string>`date(${saleSchema.createdAt})`,
      total: sql<number>`coalesce(sum(${saleSchema.total}::numeric), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(saleSchema)
    .where(
      and(
        eq(saleSchema.organizationId, orgId),
        eq(saleSchema.status, 'completed'),
        gte(saleSchema.createdAt, sevenDaysAgo),
      ),
    )
    .groupBy(sql`date(${saleSchema.createdAt})`)
    .orderBy(sql`date(${saleSchema.createdAt})`);

  return NextResponse.json({
    today: salesToday[0],
    month: salesMonth[0],
    revenueByPayment,
    topProducts,
    lowStock,
    salesTrend,
  });
}
