import { auth } from '@clerk/nextjs/server';
import { and, count, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  customerSchema,
  debtTransactionSchema,
  locationSchema,
  productSchema,
  saleItemSchema,
  saleSchema,
  stockMovementSchema,
  stockSchema,
} from '@/models/Schema';

// GET /api/sales?locationId=X — list sales for a location
export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');

  const sales = await db
    .select({
      id: saleSchema.id,
      receiptNumber: saleSchema.receiptNumber,
      customerName: saleSchema.customerName,
      paymentMethod: saleSchema.paymentMethod,
      total: saleSchema.total,
      status: saleSchema.status,
      createdAt: saleSchema.createdAt,
      locationId: saleSchema.locationId,
      locationName: locationSchema.name,
    })
    .from(saleSchema)
    .innerJoin(locationSchema, eq(saleSchema.locationId, locationSchema.id))
    .where(
      and(
        eq(saleSchema.organizationId, orgId),
        locationId ? eq(saleSchema.locationId, Number(locationId)) : undefined,
      ),
    )
    .orderBy(sql`${saleSchema.createdAt} desc`)
    .limit(100);

  return NextResponse.json(sales);
}

// POST /api/sales — register a complete sale
export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { locationId, items, customerName, customerEmail, customerWhatsapp, paymentMethod, customerId: bodyCustomerId } = body;

  if (!locationId || !items?.length || !customerName || !paymentMethod) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  // Fiado requiere un cliente identificado (no "Consumidor final")
  if (paymentMethod === 'fiado' && !bodyCustomerId) {
    return NextResponse.json(
      { error: 'El pago por fiado requiere seleccionar un cliente registrado' },
      { status: 400 },
    );
  }

  // Verify location belongs to org
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

  // Todas las queries de validación en paralelo: productos + stock + receipt number + customer
  const productIds = items.map((i: { productId: number }) => Number(i.productId));

  const [productsResult, stocksResult, countResult] = await Promise.all([
    // Trae todos los productos del carrito en una sola query
    db.select().from(productSchema).where(
      and(
        eq(productSchema.organizationId, orgId),
        eq(productSchema.isActive, true),
      ),
    ).then(rows => rows.filter(p => productIds.includes(p.id))),

    // Trae el stock de todos los productos del carrito en una sola query
    db.select().from(stockSchema).where(
      and(
        eq(stockSchema.locationId, Number(locationId)),
      ),
    ).then(rows => rows.filter(s => productIds.includes(s.productId))),

    // Cuenta las ventas para generar el número de comprobante
    db.select({ salesCount: count() }).from(saleSchema)
      .where(eq(saleSchema.organizationId, orgId)),
  ]);

  // Valida cada ítem contra los resultados obtenidos
  const enrichedItems = [];
  for (const item of items) {
    const product = productsResult.find(p => p.id === Number(item.productId));
    if (!product) {
      return NextResponse.json(
        { error: `Producto no encontrado: ${item.productId}` },
        { status: 400 },
      );
    }

    const stock = stocksResult.find(s => s.productId === product.id) ?? null;
    const available = stock?.quantity ?? 0;
    if (available < item.quantity) {
      return NextResponse.json(
        { error: `Stock insuficiente para "${product.name}". Disponible: ${available}` },
        { status: 400 },
      );
    }

    enrichedItems.push({ product, stock, quantity: item.quantity });
  }

  // Calculate total
  const total = enrichedItems.reduce(
    (sum, { product, quantity }) => sum + Number(product.price) * quantity,
    0,
  );

  const salesCount = countResult[0]?.salesCount ?? 0;
  const receiptNumber = `${orgId.slice(-6).toUpperCase()}-${String(salesCount + 1).padStart(6, '0')}`;

  // Find or create customer record
  let customerId: number | null = null;
  if (paymentMethod === 'fiado') {
    // Para fiado, el customer ya fue buscado y validado en el frontend — usamos el id directo
    customerId = Number(bodyCustomerId);
  } else if (customerName.trim() !== 'Consumidor final') {
    const existingCustomers = await db
      .select()
      .from(customerSchema)
      .where(
        and(
          eq(customerSchema.organizationId, orgId),
          eq(customerSchema.name, customerName.trim()),
        ),
      )
      .limit(1);

    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0]!.id;
    } else {
      const [newCustomer] = await db
        .insert(customerSchema)
        .values({
          organizationId: orgId,
          name: customerName.trim(),
          email: customerEmail?.trim() || null,
          whatsapp: customerWhatsapp?.trim() || null,
        })
        .returning();
      customerId = newCustomer!.id;
    }
  }

  // Create the sale record
  const [sale] = await db
    .insert(saleSchema)
    .values({
      receiptNumber,
      organizationId: orgId,
      locationId: Number(locationId),
      userId,
      customerId,
      customerName: customerName.trim(),
      customerEmail: customerEmail?.trim() || null,
      customerWhatsapp: customerWhatsapp?.trim() || null,
      paymentMethod,
      total: String(total.toFixed(2)),
      status: 'completed',
    })
    .returning();

  // Insert todos los sale items en un solo batch y actualiza stock en paralelo
  await Promise.all([
    // Batch insert de todos los ítems de la venta en una sola query
    db.insert(saleItemSchema).values(
      enrichedItems.map(({ product, quantity }) => {
        const unitPrice = Number(product.price);
        return {
          saleId: sale!.id,
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: String(unitPrice.toFixed(2)),
          subtotal: String((unitPrice * quantity).toFixed(2)),
        };
      }),
    ),

    // Actualiza stock y registra movimientos en paralelo para cada ítem
    ...enrichedItems
      .filter(({ stock }) => stock !== null)
      .map(async ({ stock, quantity }) => {
        await db.update(stockSchema)
          .set({ quantity: sql`${stockSchema.quantity} - ${quantity}` })
          .where(eq(stockSchema.id, stock!.id));
        await db.insert(stockMovementSchema).values({
          stockId: stock!.id,
          type: 'out',
          quantity,
          reason: 'sale',
          userId,
          notes: `Venta ${receiptNumber}`,
        });
      }),
  ]);

  // Si el pago fue por fiado, registrar la deuda automáticamente vinculada a la venta
  if (paymentMethod === 'fiado' && customerId) {
    const [customer] = await db
      .select({ name: customerSchema.name })
      .from(customerSchema)
      .where(eq(customerSchema.id, customerId));

    if (customer) {
      await db.insert(debtTransactionSchema).values({
        organizationId: orgId,
        locationId: Number(locationId),
        customerId,
        customerName: customer.name,
        type: 'charge',
        amount: String(total.toFixed(2)),
        description: `Venta ${receiptNumber}`,
        saleId: sale!.id,
        userId,
      });
    }
  }

  // Return full sale with items for ticket printing
  const saleItems = await db
    .select()
    .from(saleItemSchema)
    .where(eq(saleItemSchema.saleId, sale!.id));

  return NextResponse.json({ sale, items: saleItems }, { status: 201 });
}
