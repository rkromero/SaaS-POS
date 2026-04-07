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

// GET /api/stock?locationId=X — stock for a specific location
// GET /api/stock — consolidated stock for all org locations (admin only)
export async function GET(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');

  if (locationId) {
    // Verify the location belongs to the org
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

    // Left join from products → stock so ALL active products appear,
    // even those without a stock record yet (shown with quantity 0)
    const stock = await db
      .select({
        id: stockSchema.id,
        quantity: stockSchema.quantity,
        lowStockThreshold: stockSchema.lowStockThreshold,
        productId: productSchema.id,
        productName: productSchema.name,
        productSku: productSchema.sku,
        productBarcode: productSchema.barcode,
        productImageUrl: productSchema.imageUrl,
        productIsActive: productSchema.isActive,
        categoryName: categorySchema.name,
        locationId: stockSchema.locationId,
      })
      .from(productSchema)
      .leftJoin(
        stockSchema,
        and(
          eq(stockSchema.productId, productSchema.id),
          eq(stockSchema.locationId, Number(locationId)),
        ),
      )
      .leftJoin(categorySchema, eq(productSchema.categoryId, categorySchema.id))
      .where(
        and(
          eq(productSchema.organizationId, orgId),
          eq(productSchema.isActive, true),
        ),
      )
      .orderBy(productSchema.name);

    // Normalize: products without stock record get quantity 0
    const normalized = stock.map(row => ({
      ...row,
      id: row.id ?? null,
      quantity: row.quantity ?? 0,
      lowStockThreshold: row.lowStockThreshold ?? 5,
      locationId: row.locationId ?? Number(locationId),
    }));

    return NextResponse.json(normalized);
  }

  // Consolidated view — admin only
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const locations = await db
    .select()
    .from(locationSchema)
    .where(eq(locationSchema.organizationId, orgId));

  const stock = await db
    .select({
      id: stockSchema.id,
      quantity: stockSchema.quantity,
      lowStockThreshold: stockSchema.lowStockThreshold,
      productId: productSchema.id,
      productName: productSchema.name,
      productSku: productSchema.sku,
      productIsActive: productSchema.isActive,
      categoryName: categorySchema.name,
      locationId: stockSchema.locationId,
      locationName: locationSchema.name,
    })
    .from(stockSchema)
    .innerJoin(productSchema, eq(stockSchema.productId, productSchema.id))
    .innerJoin(locationSchema, eq(stockSchema.locationId, locationSchema.id))
    .leftJoin(categorySchema, eq(productSchema.categoryId, categorySchema.id))
    .where(eq(locationSchema.organizationId, orgId))
    .orderBy(locationSchema.name, productSchema.name);

  return NextResponse.json({ locations, stock });
}
