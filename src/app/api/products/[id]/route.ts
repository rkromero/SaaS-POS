import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { productSchema } from '@/models/Schema';

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

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const body = await request.json();
  const { name, description, price, costPrice, sku, imageUrl, categoryId, isActive } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  if (!price || Number.isNaN(Number(price)) || Number(price) < 0) {
    return NextResponse.json({ error: 'El precio de venta es requerido' }, { status: 400 });
  }

  const [updated] = await db
    .update(productSchema)
    .set({
      name: name.trim(),
      description: description?.trim() || null,
      price: String(Number(price).toFixed(2)),
      costPrice: costPrice ? String(Number(costPrice).toFixed(2)) : null,
      sku: sku?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      categoryId: categoryId ? Number(categoryId) : null,
      isActive: isActive ?? true,
    })
    .where(and(eq(productSchema.id, id), eq(productSchema.organizationId, orgId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const [deleted] = await db
    .delete(productSchema)
    .where(and(eq(productSchema.id, id), eq(productSchema.organizationId, orgId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
