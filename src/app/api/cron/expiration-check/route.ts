// Cron job: verifica vencimientos diariamente y registra alertas pendientes.
// Protegido con CRON_SECRET. Configurar en vercel.json como cron diario.
//
// Para habilitar email: instalar 'resend' y descomentar la sección EMAIL.
// La tabla expiration_alert_log garantiza una alerta por lote/umbral (no duplicados).

import { and, eq, gt, inArray, isNotNull, lte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import {
  expirationAlertConfigSchema,
  expirationAlertLogSchema,
  locationSchema,
  orgModuleSchema,
  productSchema,
  stockBatchSchema,
  stockSchema,
} from '@/models/Schema';

export async function POST(request: Request) {
  // Validate cron secret — Vercel injects Authorization header automatically
  const authHeader = request.headers.get('Authorization');
  const expectedSecret = Env.CRON_SECRET;
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all orgs with stock_expiration module active
  const moduleRows = await db
    .select({ orgId: orgModuleSchema.orgId })
    .from(orgModuleSchema)
    .where(eq(orgModuleSchema.moduleName, 'stock_expiration'));

  if (moduleRows.length === 0) {
    return NextResponse.json({ checked: 0, alerts: 0 });
  }

  const orgIds = moduleRows.map(r => r.orgId);

  // Fetch all alert configs for these orgs
  const configs = await db
    .select()
    .from(expirationAlertConfigSchema)
    .where(inArray(expirationAlertConfigSchema.organizationId, orgIds));

  if (configs.length === 0) {
    return NextResponse.json({ checked: orgIds.length, alerts: 0 });
  }

  let alertsCreated = 0;

  for (const config of configs) {
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() + config.thresholdDays);

    // Find batches that:
    // 1. Belong to this org
    // 2. Have a non-null expiration date within [today, cutoffDate]
    // 3. Still have quantity > 0
    // 4. Have NOT already been alerted for this threshold
    const batches = await db
      .select({
        batchId: stockBatchSchema.id,
        expirationDate: stockBatchSchema.expirationDate,
        quantity: stockBatchSchema.quantity,
        productName: productSchema.name,
        locationName: locationSchema.name,
      })
      .from(stockBatchSchema)
      .innerJoin(stockSchema, eq(stockBatchSchema.stockId, stockSchema.id))
      .innerJoin(productSchema, eq(stockSchema.productId, productSchema.id))
      .innerJoin(locationSchema, eq(stockSchema.locationId, locationSchema.id))
      .where(
        and(
          eq(locationSchema.organizationId, config.organizationId),
          isNotNull(stockBatchSchema.expirationDate),
          gt(stockBatchSchema.quantity, 0),
          lte(stockBatchSchema.expirationDate, cutoffDate),
          // Exclude already-alerted batches for this threshold
          sql`${stockBatchSchema.id} NOT IN (
            SELECT stock_batch_id FROM expiration_alert_log
            WHERE threshold_days = ${config.thresholdDays}
          )`,
        ),
      );

    for (const batch of batches) {
      // Log the alert (unique constraint prevents duplicates)
      try {
        await db.insert(expirationAlertLogSchema).values({
          organizationId: config.organizationId,
          stockBatchId: batch.batchId,
          thresholdDays: config.thresholdDays,
        }).onConflictDoNothing();

        alertsCreated++;

        // ── EMAIL (opcional — descomentar cuando se configure Resend) ────────
        // if (config.emailEnabled) {
        //   await sendExpirationEmail({
        //     orgId: config.organizationId,
        //     product: batch.productName,
        //     location: batch.locationName,
        //     expirationDate: batch.expirationDate,
        //     quantity: batch.quantity,
        //     thresholdDays: config.thresholdDays,
        //   });
        // }
        // ────────────────────────────────────────────────────────────────────
      } catch {
        // onConflictDoNothing handles duplicates; ignore other errors per batch
      }
    }
  }

  return NextResponse.json({
    checked: orgIds.length,
    configsProcessed: configs.length,
    alerts: alertsCreated,
    runAt: today.toISOString(),
  });
}
