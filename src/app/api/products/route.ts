import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { categorySchema, productSchema } from '@/models/Schema';

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = await db
    .select({
      id: productSchema.id,
      name: productSchema.name,
      description: productSchema.description,
      price: productSchema.price,
      costPrice: productSchema.costPrice,
      sku: productSchema.sku,
      barcode: productSchema.barcode,
      imageUrl: productSchema.imageUrl,
      isActive: productSchema.isActive,
      categoryId: productSchema.categoryId,
      categoryName: categorySchema.name,
      createdAt: productSchema.createdAt,
    })
    .from(productSchema)
    .leftJoin(categorySchema, eq(productSchema.categoryId, categorySchema.id))
    .where(eq(productSchema.organizationId, orgId))
    .orderBy(productSchema.name);

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, price, costPrice, sku, barcode, imageUrl, categoryId } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  if (!price || Number.isNaN(Number(price)) || Number(price) < 0) {
    return NextResponse.json({ error: 'El precio de venta es requerido' }, { status: 400 });
  }

  const [product] = await db
    .insert(productSchema)
    .values({
      organizationId: orgId,
      name: name.trim(),
      description: description?.trim() || null,
      price: String(Number(price).toFixed(2)),
      costPrice: costPrice ? String(Number(costPrice).toFixed(2)) : null,
      sku: sku?.trim() || null,
      barcode: barcode?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      categoryId: categoryId ? Number(categoryId) : null,
    })
    .returning();

  return NextResponse.json(product, { status: 201 });
}
