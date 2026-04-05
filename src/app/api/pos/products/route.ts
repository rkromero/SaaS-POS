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

  const products = await db
    .select({
      id: productSchema.id,
      name: productSchema.name,
      description: productSchema.description,
      price: productSchema.price,
      sku: productSchema.sku,
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
    .orderBy(productSchema.name);

  return NextResponse.json(products);
}
