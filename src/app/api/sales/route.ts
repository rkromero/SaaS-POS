import { auth } from '@clerk/nextjs/server';
import { and, count, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { getOrgAccess } from '@/libs/OrgAccess';
import {
  customerSchema,
  debtTransactionSchema,
  locationSchema,
  loyaltyConfigSchema,
  loyaltyRedemptionSchema,
  loyaltyRewardSchema,
  loyaltyTransactionSchema,
  productSchema,
  saleItemSchema,
  saleSchema,
  stockMovementSchema,
  stockSchema,
  userLocationSchema,
} from '@/models/Schema';

// GET /api/sales?locationId=X — list sales for a location
export async function GET(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let locationId = searchParams.get('locationId');

  // Non-admins can only see their assigned location
  if (orgRole !== 'org:admin') {
    const [assignment] = await db
      .select({ locationId: userLocationSchema.locationId })
      .from(userLocationSchema)
      .where(eq(userLocationSchema.userId, userId));
    if (!assignment) {
      return NextResponse.json([]);
    }
    locationId = String(assignment.locationId);
  }

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
  const {
    locationId,
    items,
    customerName,
    customerEmail,
    customerWhatsapp,
    paymentMethod,
    customerId: bodyCustomerId,
    // Loyalty: cliente identificado para acumular puntos
    loyaltyCustomerId: bodyLoyaltyCustomerId,
    // Loyalty: ID del premio a canjear en esta venta
    loyaltyRewardId: bodyLoyaltyRewardId,
  } = body;

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

  // Todas las queries de validación en paralelo: productos + stock + receipt number + plan + ventas del mes
  const productIds = items.map((i: { productId: number }) => Number(i.productId));
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const loyaltyCustomerId = bodyLoyaltyCustomerId ? Number(bodyLoyaltyCustomerId) : null;
  const loyaltyRewardId = bodyLoyaltyRewardId ? Number(bodyLoyaltyRewardId) : null;

  const [productsResult, stocksResult, countResult, monthlySalesResult, access, loyaltyConfig] = await Promise.all([
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

    // Cuenta las ventas totales para generar el número de comprobante
    db.select({ salesCount: count() }).from(saleSchema)
      .where(eq(saleSchema.organizationId, orgId)),

    // Cuenta las ventas del mes actual para verificar el límite del plan
    db.select({ monthlyCount: count() }).from(saleSchema)
      .where(and(
        eq(saleSchema.organizationId, orgId),
        gte(saleSchema.createdAt, startOfMonth),
      )),

    // Plan y límites de la org
    getOrgAccess(orgId),

    // Config del programa de fidelización (si existe)
    db.select().from(loyaltyConfigSchema).where(eq(loyaltyConfigSchema.organizationId, orgId)).limit(1).then(r => r[0] ?? null),
  ]);

  // ── Verificar límite mensual de ventas según el plan ─────────────────────
  const monthlyCount = monthlySalesResult[0]?.monthlyCount ?? 0;
  if (!access.canRegisterSale(monthlyCount)) {
    return NextResponse.json(
      {
        error: access.saleLimitMessage,
        code: 'PLAN_LIMIT_SALES',
        current: monthlyCount,
        limit: access.maxMonthlySales,
      },
      { status: 403 },
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

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

  // Calculate total from cart items
  const rawTotal = enrichedItems.reduce(
    (sum, { product, quantity }) => sum + Number(product.price) * quantity,
    0,
  );

  // ── Loyalty: validar y calcular descuento por canje ──────────────────────
  let loyaltyDiscount = 0;
  let loyaltyReward: typeof loyaltyRewardSchema.$inferSelect | null = null;

  if (loyaltyRewardId && loyaltyCustomerId && loyaltyConfig?.isActive) {
    // Cargar el premio y el balance del cliente en paralelo
    const [rewardRows, balanceRows] = await Promise.all([
      db.select().from(loyaltyRewardSchema)
        .where(and(eq(loyaltyRewardSchema.id, loyaltyRewardId), eq(loyaltyRewardSchema.organizationId, orgId)))
        .limit(1),
      db.select({ balance: sql<number>`COALESCE(SUM(${loyaltyTransactionSchema.points}), 0)` })
        .from(loyaltyTransactionSchema)
        .where(and(
          eq(loyaltyTransactionSchema.customerId, loyaltyCustomerId),
          eq(loyaltyTransactionSchema.organizationId, orgId),
        )),
    ]);

    loyaltyReward = rewardRows[0] ?? null;
    const availablePoints = Number(balanceRows[0]?.balance ?? 0);

    if (!loyaltyReward || !loyaltyReward.isActive) {
      return NextResponse.json({ error: 'Premio de fidelización no encontrado o inactivo' }, { status: 400 });
    }
    if (availablePoints < loyaltyReward.pointsCost) {
      return NextResponse.json(
        { error: `Puntos insuficientes. Disponibles: ${availablePoints}, requeridos: ${loyaltyReward.pointsCost}` },
        { status: 400 },
      );
    }
    if (loyaltyConfig.minPointsToRedeem > 0 && availablePoints < loyaltyConfig.minPointsToRedeem) {
      return NextResponse.json(
        { error: `Se requieren al menos ${loyaltyConfig.minPointsToRedeem} puntos para canjear` },
        { status: 400 },
      );
    }
    // Verificar stock del premio
    if (loyaltyReward.stock !== null && loyaltyReward.stock <= 0) {
      return NextResponse.json({ error: 'Este premio ya no tiene stock disponible' }, { status: 400 });
    }

    // Calcular descuento según tipo de premio
    if (loyaltyReward.type === 'discount_fixed') {
      loyaltyDiscount = Math.min(Number(loyaltyReward.discountValue ?? 0), rawTotal);
    } else if (loyaltyReward.type === 'discount_percent') {
      loyaltyDiscount = rawTotal * (Number(loyaltyReward.discountValue ?? 0) / 100);
    }
    // type === 'product': descuento monetario 0, el producto se entrega aparte
  }

  // Total efectivo después de aplicar descuento de fidelización
  const total = Math.max(0, rawTotal - loyaltyDiscount);
  // ─────────────────────────────────────────────────────────────────────────

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

  // ── Loyalty: acumular y/o canjear puntos ─────────────────────────────────
  // El cliente de fidelización puede ser el mismo que el cliente de la venta
  // o uno diferente (ej: el comprador no tiene fiado pero sí tarjeta de puntos).
  const effectiveLoyaltyCustomerId = loyaltyCustomerId ?? customerId;

  if (loyaltyConfig?.isActive && effectiveLoyaltyCustomerId) {
    // 1. Procesar canje si se solicitó un premio
    if (loyaltyReward && loyaltyRewardId) {
      // Insertar registro del canje y luego el débito de puntos de forma secuencial
      // (el débito necesita el ID del canje creado)
      const [redemption] = await db.insert(loyaltyRedemptionSchema).values({
        organizationId: orgId,
        customerId: effectiveLoyaltyCustomerId,
        customerName: customerName.trim(),
        rewardId: loyaltyRewardId,
        rewardName: loyaltyReward.name,
        pointsSpent: loyaltyReward.pointsCost,
        discountApplied: String(loyaltyDiscount.toFixed(2)),
        saleId: sale!.id,
        userId,
        status: 'completed',
      }).returning();

      const redeemOps: Promise<unknown>[] = [
        db.insert(loyaltyTransactionSchema).values({
          organizationId: orgId,
          customerId: effectiveLoyaltyCustomerId,
          type: 'redeem',
          points: -loyaltyReward.pointsCost,
          saleId: sale!.id,
          redemptionId: redemption!.id,
          description: `Canje: ${loyaltyReward.name} (${receiptNumber})`,
          userId,
        }),
      ];

      // Decrementar stock del premio si tiene límite
      if (loyaltyReward.stock !== null) {
        redeemOps.push(
          db.update(loyaltyRewardSchema)
            .set({ stock: sql`${loyaltyRewardSchema.stock} - 1` })
            .where(eq(loyaltyRewardSchema.id, loyaltyRewardId)),
        );
      }

      await Promise.all(redeemOps);
    }

    // 2. Acumular puntos por la compra (sobre el total después del descuento)
    const pesosPerPoint = Number(loyaltyConfig.pesosPerPoint);
    const pointsEarned = Math.floor(total / pesosPerPoint);
    if (pointsEarned > 0) {
      await db.insert(loyaltyTransactionSchema).values({
        organizationId: orgId,
        customerId: effectiveLoyaltyCustomerId,
        type: 'earn',
        points: pointsEarned,
        saleId: sale!.id,
        description: `Compra ${receiptNumber}`,
        userId,
      });
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Return full sale with items for ticket printing
  const saleItems = await db
    .select()
    .from(saleItemSchema)
    .where(eq(saleItemSchema.saleId, sale!.id));

  // Calcular puntos ganados para devolver en la respuesta (info para el ticket)
  const loyaltyPointsEarned = (loyaltyConfig?.isActive && effectiveLoyaltyCustomerId)
    ? Math.floor(total / Number(loyaltyConfig.pesosPerPoint))
    : 0;

  return NextResponse.json({
    sale,
    items: saleItems,
    loyalty: {
      pointsEarned: loyaltyPointsEarned,
      pointsRedeemed: loyaltyReward?.pointsCost ?? 0,
      discountApplied: loyaltyDiscount,
    },
  }, { status: 201 });
}
