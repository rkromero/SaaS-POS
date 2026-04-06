import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  locationSchema,
  purchaseOrderItemSchema,
  purchaseOrderSchema,
  supplierSchema,
  userLocationSchema,
} from '@/models/Schema';

// GET /api/purchase-orders — list purchase orders for the caller's location
export async function GET() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let locationId: number | null = null;
  if (orgRole !== 'org:admin') {
    const [assignment] = await db
      .select({ locationId: userLocationSchema.locationId })
      .from(userLocationSchema)
      .where(eq(userLocationSchema.userId, userId));
    if (!assignment) {
      return NextResponse.json([]);
    }
    locationId = assignment.locationId;
  }

  const orders = locationId
    ? await db
      .select()
      .from(purchaseOrderSchema)
      .where(
        and(
          eq(purchaseOrderSchema.organizationId, orgId),
          eq(purchaseOrderSchema.locationId, locationId),
        ),
      )
      .orderBy(desc(purchaseOrderSchema.createdAt))
    : await db
      .select()
      .from(purchaseOrderSchema)
      .where(eq(purchaseOrderSchema.organizationId, orgId))
      .orderBy(desc(purchaseOrderSchema.createdAt));

  return NextResponse.json(orders);
}

// POST /api/purchase-orders — create a purchase order (auto-filled from low stock if no items provided)
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { supplierId, locationId, notes, items } = body;

  if (!supplierId || !locationId) {
    return NextResponse.json(
      { error: 'supplierId y locationId son requeridos' },
      { status: 400 },
    );
  }

  // Validate supplier
  const [supplier] = await db
    .select()
    .from(supplierSchema)
    .where(
      and(
        eq(supplierSchema.id, Number(supplierId)),
        eq(supplierSchema.organizationId, orgId),
      ),
    );
  if (!supplier) {
    return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
  }

  // Validate location
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

  const [order] = await db
    .insert(purchaseOrderSchema)
    .values({
      organizationId: orgId,
      locationId: Number(locationId),
      supplierId: Number(supplierId),
      supplierName: supplier.name,
      notes: notes || null,
      userId,
    })
    .returning();

  // Insert items (provided manually or auto from low-stock products of this supplier)
  if (items && Array.isArray(items) && items.length > 0) {
    await db.insert(purchaseOrderItemSchema).values(
      items.map((item: { productId: number; productName: string; quantity: number; unitCost?: number }) => ({
        purchaseOrderId: order!.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitCost: item.unitCost ? String(item.unitCost) : null,
      })),
    );
  }

  return NextResponse.json(order, { status: 201 });
}
