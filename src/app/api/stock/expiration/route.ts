import { auth } from '@clerk/nextjs/server';
import { and, asc, eq, gte, isNotNull, lte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { getOrgAccess } from '@/libs/OrgAccess';
import {
  expirationAlertConfigSchema,
  locationSchema,
  productSchema,
  stockBatchSchema,
  stockSchema,
} from '@/models/Schema';

// GET /api/stock/expiration?days=30&locationId=1&status=expiring|expired
// Lista lotes próximos a vencer o ya vencidos para esta organización.
export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getOrgAccess(orgId);
  if (!access.hasModule('stock_expiration')) {
    return NextResponse.json({ error: 'Módulo no disponible en tu plan' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId') ? Number(searchParams.get('locationId')) : null;
  const status = searchParams.get('status') ?? 'expiring'; // 'expiring' | 'expired' | 'all'

  // Resolve the threshold: use the smallest configured threshold, or default 30 days
  const configRows = await db
    .select()
    .from(expirationAlertConfigSchema)
    .where(eq(expirationAlertConfigSchema.organizationId, orgId));

  // Use configured thresholds or default 30 days for display
  const daysParam = searchParams.get('days');
  let lookAheadDays = daysParam ? Number(daysParam) : 30;
  if (configRows.length > 0 && !daysParam) {
    // Use the maximum threshold to show everything that's in any alert window
    lookAheadDays = Math.max(...configRows.map(r => r.thresholdDays));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() + lookAheadDays);

  // Build date filter based on status
  let dateFilter;
  if (status === 'expired') {
    // Already expired: expirationDate < today
    dateFilter = sql`${stockBatchSchema.expirationDate} < ${today.toISOString().slice(0, 10)}`;
  } else if (status === 'expiring') {
    // Expiring soon: today <= expirationDate <= cutoff (not yet expired)
    dateFilter = and(
      gte(stockBatchSchema.expirationDate, today),
      lte(stockBatchSchema.expirationDate, cutoffDate),
    );
  } else {
    // all: today <= expirationDate <= cutoff OR already expired
    dateFilter = lte(stockBatchSchema.expirationDate, cutoffDate);
  }

  const locationFilter = locationId
    ? eq(locationSchema.id, locationId)
    : undefined;

  const rows = await db
    .select({
      batchId: stockBatchSchema.id,
      batchNumber: stockBatchSchema.batchNumber,
      batchQuantity: stockBatchSchema.quantity,
      expirationDate: stockBatchSchema.expirationDate,
      batchNotes: stockBatchSchema.notes,
      batchCreatedAt: stockBatchSchema.createdAt,
      stockId: stockSchema.id,
      productId: productSchema.id,
      productName: productSchema.name,
      productSku: productSchema.sku,
      locationId: locationSchema.id,
      locationName: locationSchema.name,
    })
    .from(stockBatchSchema)
    .innerJoin(stockSchema, eq(stockBatchSchema.stockId, stockSchema.id))
    .innerJoin(productSchema, eq(stockSchema.productId, productSchema.id))
    .innerJoin(locationSchema, eq(stockSchema.locationId, locationSchema.id))
    .where(
      and(
        eq(locationSchema.organizationId, orgId),
        isNotNull(stockBatchSchema.expirationDate),
        sql`${stockBatchSchema.quantity} > 0`,
        dateFilter,
        ...(locationFilter ? [locationFilter] : []),
      ),
    )
    .orderBy(asc(stockBatchSchema.expirationDate));

  // Enrich with days until expiration
  const todayMs = today.getTime();
  const result = rows.map((row) => {
    const expMs = row.expirationDate ? new Date(row.expirationDate).getTime() : null;
    const daysUntilExpiration = expMs != null ? Math.ceil((expMs - todayMs) / 86400000) : null;
    return {
      ...row,
      daysUntilExpiration,
      isExpired: daysUntilExpiration != null && daysUntilExpiration < 0,
    };
  });

  return NextResponse.json({ batches: result, lookAheadDays, thresholds: configRows });
}
