import { auth } from '@clerk/nextjs/server';
import { and, asc, eq, gt, isNotNull, sql } from 'drizzle-orm';
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

// GET /api/stock/expiration?status=expiring|expired|all&days=30&locationId=1
export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let access;
  try {
    access = await getOrgAccess(orgId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `getOrgAccess falló: ${msg}` }, { status: 500 });
  }

  if (!access.hasModule('stock_expiration')) {
    return NextResponse.json({ error: 'Módulo no disponible en tu plan' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId') ? Number(searchParams.get('locationId')) : null;
  const status = searchParams.get('status') ?? 'expiring';

  // Resolve look-ahead window
  type ConfigRow = { id: number; organizationId: string; thresholdDays: number; emailEnabled: boolean; inAppEnabled: boolean; createdAt: Date };
  let configRows: ConfigRow[] = [];
  try {
    configRows = await db
      .select()
      .from(expirationAlertConfigSchema)
      .where(eq(expirationAlertConfigSchema.organizationId, orgId));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `configRows query falló: ${msg}` }, { status: 500 });
  }

  const daysParam = searchParams.get('days');
  let lookAheadDays = daysParam ? Number(daysParam) : 30;
  if (configRows.length > 0 && !daysParam) {
    lookAheadDays = Math.max(...configRows.map(r => r.thresholdDays));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() + lookAheadDays);

  // Use ISO date strings — Drizzle date columns accept 'YYYY-MM-DD' strings
  const todayStr = today.toISOString().slice(0, 10);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  // Build date filter
  let dateFilter;
  if (status === 'expired') {
    // Vencidos: fecha < hoy
    dateFilter = sql`${stockBatchSchema.expirationDate} < ${todayStr}`;
  } else if (status === 'expiring') {
    // Por vencer: hoy <= fecha <= cutoff
    dateFilter = sql`${stockBatchSchema.expirationDate} >= ${todayStr} AND ${stockBatchSchema.expirationDate} <= ${cutoffStr}`;
  }
  // status === 'all': sin filtro de fecha — muestra todos los lotes con fecha de vencimiento

  // Build conditions array
  const conditions = [
    eq(locationSchema.organizationId, orgId),
    isNotNull(stockBatchSchema.expirationDate),
    gt(stockBatchSchema.quantity, 0),
    ...(dateFilter ? [dateFilter] : []),
    ...(locationId ? [eq(locationSchema.id, locationId)] : []),
  ];

  try {
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
      .where(and(...conditions))
      .orderBy(asc(stockBatchSchema.expirationDate));

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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Error en la consulta: ${message}` }, { status: 500 });
  }
}
