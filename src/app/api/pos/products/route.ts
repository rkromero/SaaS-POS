import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  categorySchema,
  locationSchema,
  productSchema,
  stockSchema,
} from '@/models/Schema';

// GET /api/pos/products?locationId=X
// Returns active products with current stock for the POS screen
export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');

  if (!locationId) {
    return NextResponse.json({ error: 'locationId requerido' }, { status: 400 });
  }

  // Verificación de local y carga de productos en paralelo
  const [locationResult, products] = await Promise.all([
    db.select({ id: locationSchema.id })
      .from(locationSchema)
      .where(
        and(
          eq(locationSchema.id, Number(locationId)),
          eq(locationSchema.organizationId, orgId),
        ),
      )
      .limit(1),

    db.select({
      id: productSchema.id,
      name: productSchema.name,
      description: productSchema.description,
      price: productSchema.price,
      sku: productSchema.sku,
      barcode: productSchema.barcode,
      imageUrl: productSchema.imageUrl,
      categoryId: productSchema.categoryId,
      categoryName: categorySchema.name,
      stock: stockSchema.quantity,
    })
      .from(productSchema)
      .leftJoin(categorySchema, eq(productSchema.categoryId, categorySchema.id))
      .leftJoin(
        stockSchema,
        and(
          eq(stockSchema.productId, productSchema.id),
          eq(stockSchema.locationId, Number(locationId)),
        ),
      )
      .where(
        and(
          eq(productSchema.organizationId, orgId),
          eq(productSchema.isActive, true),
        ),
      )
      .orderBy(productSchema.name),
  ]);

  if (!locationResult[0]) {
    return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
  }

  // Cache 30s en el browser: si el cajero completa una venta y vuelve al POS,
  // los productos cargan instantáneamente desde caché en lugar de ir a Railway.
  return NextResponse.json(products, {
    headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
  });
}
