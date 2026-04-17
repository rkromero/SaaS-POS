// FEFO helper — consume lotes ordenados por fecha de vencimiento (más viejo primero).
// Llamar después de descontar de stock.quantity para mantener consistencia.

import { and, asc, eq, gt, sql } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { stockBatchSchema } from '@/models/Schema';

export async function deductBatchesFEFO(stockId: number, quantity: number): Promise<void> {
  const batches = await db
    .select()
    .from(stockBatchSchema)
    .where(
      and(
        eq(stockBatchSchema.stockId, stockId),
        gt(stockBatchSchema.quantity, 0),
      ),
    )
    // Primero los que vencen antes; los sin fecha al final
    .orderBy(
      sql`${stockBatchSchema.expirationDate} ASC NULLS LAST`,
      asc(stockBatchSchema.id),
    );

  let remaining = quantity;
  for (const batch of batches) {
    if (remaining <= 0) {
      break;
    }
    const consume = Math.min(batch.quantity, remaining);
    remaining -= consume;
    await db
      .update(stockBatchSchema)
      .set({ quantity: batch.quantity - consume })
      .where(eq(stockBatchSchema.id, batch.id));
  }
}
