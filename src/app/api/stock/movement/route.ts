import { auth } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { getOrgAccess } from '@/libs/OrgAccess';
import { deductBatchesFEFO } from '@/libs/StockBatchFEFO';
import {
  locationSchema,
  stockBatchSchema,
  stockMovementSchema,
  stockSchema,
} from '@/models/Schema';

// POST /api/stock/movement — register a stock in or out
export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { productId, locationId, type, quantity, reason, notes, expirationDate, batchNumber } = body;

  if (!productId || !locationId || !type || !quantity || !reason) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  if (!['in', 'out'].includes(type)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  }

  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty <= 0) {
    return NextResponse.json({ error: 'La cantidad debe ser mayor a 0' }, { status: 400 });
  }

  // Verify the location belongs to this org
  const [location] = await db
    .select()
    .from(locationSchema)
    .where(
      and(
        eq(locationSchema.id, Number(locationId)),
        eq(locationSchema.organizationId, orgId),
      ),
    );

  if (!location) {
    return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
  }

  // Get or create stock record for this product+location
  const existing = await db
    .select()
    .from(stockSchema)
    .where(
      and(
        eq(stockSchema.productId, Number(productId)),
        eq(stockSchema.locationId, Number(locationId)),
      ),
    );

  let stock = existing[0];

  if (!stock) {
    const inserted = await db
      .insert(stockSchema)
      .values({
        productId: Number(productId),
        locationId: Number(locationId),
        quantity: 0,
      })
      .returning();
    stock = inserted[0]!;
  }

  // Validate we have enough stock for outgoing movements
  if (type === 'out' && stock.quantity < qty) {
    return NextResponse.json(
      { error: `Stock insuficiente. Disponible: ${stock.quantity}` },
      { status: 400 },
    );
  }

  // Check if stock_expiration module is active for this org
  const access = await getOrgAccess(orgId);
  const hasExpiration = access.hasModule('stock_expiration');

  // Update stock quantity atomically
  const delta = type === 'in' ? qty : -qty;
  const [updatedStock] = await db
    .update(stockSchema)
    .set({ quantity: sql`${stockSchema.quantity} + ${delta}` })
    .where(eq(stockSchema.id, stock.id))
    .returning();

  // Record the movement for audit trail
  const [movement] = await db
    .insert(stockMovementSchema)
    .values({
      stockId: stock.id,
      type,
      quantity: qty,
      reason,
      userId,
      notes: notes?.trim() || null,
    })
    .returning();

  // Batch tracking (only when expiration module is active)
  if (hasExpiration) {
    if (type === 'in') {
      // Create a new batch for this incoming stock
      const expDate = expirationDate ? new Date(expirationDate) : null;
      await db.insert(stockBatchSchema).values({
        stockId: stock.id,
        quantity: qty,
        expirationDate: expDate,
        batchNumber: batchNumber?.trim() || null,
        notes: notes?.trim() || null,
      });
    } else {
      await deductBatchesFEFO(stock.id, qty);
    }
  }

  return NextResponse.json({ stock: updatedStock, movement }, { status: 201 });
}
