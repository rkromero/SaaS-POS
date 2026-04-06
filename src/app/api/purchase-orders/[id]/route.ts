import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  purchaseOrderItemSchema,
  purchaseOrderSchema,
  stockMovementSchema,
  stockSchema,
} from '@/models/Schema';

// GET /api/purchase-orders/[id] — get order with items
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [order] = await db
    .select()
    .from(purchaseOrderSchema)
    .where(
      and(
        eq(purchaseOrderSchema.id, Number(params.id)),
        eq(purchaseOrderSchema.organizationId, orgId),
      ),
    );
  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  }

  const items = await db
    .select()
    .from(purchaseOrderItemSchema)
    .where(eq(purchaseOrderItemSchema.purchaseOrderId, order.id));

  return NextResponse.json({ ...order, items });
}

// PUT /api/purchase-orders/[id] — receive order: marks as received and updates stock
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { action, notes } = body; // action: 'receive' | 'cancel'

  const [order] = await db
    .select()
    .from(purchaseOrderSchema)
    .where(
      and(
        eq(purchaseOrderSchema.id, Number(params.id)),
        eq(purchaseOrderSchema.organizationId, orgId),
      ),
    );
  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  }
  if (order.status !== 'pending') {
    return NextResponse.json(
      { error: `El pedido ya está ${order.status}` },
      { status: 409 },
    );
  }

  if (action === 'cancel') {
    const [updated] = await db
      .update(purchaseOrderSchema)
      .set({ status: 'cancelled', notes: notes || order.notes })
      .where(eq(purchaseOrderSchema.id, order.id))
      .returning();
    return NextResponse.json(updated);
  }

  if (action === 'receive') {
    // Fetch items to update stock
    const items = await db
      .select()
      .from(purchaseOrderItemSchema)
      .where(eq(purchaseOrderItemSchema.purchaseOrderId, order.id));

    // For each item with a productId, upsert stock and register a movement
    for (const item of items) {
      if (!item.productId) {
        continue;
      }

      // Try to find existing stock record
      const [existing] = await db
        .select()
        .from(stockSchema)
        .where(
          and(
            eq(stockSchema.productId, item.productId),
            eq(stockSchema.locationId, order.locationId),
          ),
        );

      let stockId: number;

      if (existing) {
        await db
          .update(stockSchema)
          .set({ quantity: existing.quantity + item.quantity })
          .where(eq(stockSchema.id, existing.id));
        stockId = existing.id;
      } else {
        const [inserted] = await db
          .insert(stockSchema)
          .values({
            productId: item.productId,
            locationId: order.locationId,
            quantity: item.quantity,
          })
          .returning();
        stockId = inserted!.id;
      }

      await db.insert(stockMovementSchema).values({
        stockId,
        type: 'in',
        quantity: item.quantity,
        reason: 'purchase',
        userId,
        notes: `Recepción de pedido #${order.id}`,
      });
    }

    const [updated] = await db
      .update(purchaseOrderSchema)
      .set({
        status: 'received',
        receivedByUserId: userId,
        receivedAt: new Date(),
        notes: notes || order.notes,
      })
      .where(eq(purchaseOrderSchema.id, order.id))
      .returning();

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'action debe ser "receive" o "cancel"' }, { status: 400 });
}
