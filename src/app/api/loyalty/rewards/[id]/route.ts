import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { loyaltyRewardSchema } from '@/models/Schema';

// PUT /api/loyalty/rewards/:id — actualizar un premio
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Solo administradores pueden editar premios' }, { status: 403 });
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(loyaltyRewardSchema)
    .where(and(eq(loyaltyRewardSchema.id, id), eq(loyaltyRewardSchema.organizationId, orgId)));

  if (!existing) {
    return NextResponse.json({ error: 'Premio no encontrado' }, { status: 404 });
  }

  const body = await request.json();
  const { name, description, type, pointsCost, discountValue, productId, stock, isActive } = body;

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });
  }
  if (type !== undefined && !['product', 'discount_fixed', 'discount_percent'].includes(type)) {
    return NextResponse.json({ error: 'Tipo de premio inválido' }, { status: 400 });
  }
  if (pointsCost !== undefined && Number(pointsCost) <= 0) {
    return NextResponse.json({ error: 'El costo en puntos debe ser mayor a 0' }, { status: 400 });
  }
  const effectiveType = type ?? existing.type;
  if (effectiveType === 'discount_percent' && discountValue !== undefined && Number(discountValue) > 100) {
    return NextResponse.json({ error: 'El porcentaje no puede superar 100' }, { status: 400 });
  }

  const [updated] = await db
    .update(loyaltyRewardSchema)
    .set({
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(type !== undefined && { type }),
      ...(pointsCost !== undefined && { pointsCost: Number(pointsCost) }),
      ...(discountValue !== undefined && { discountValue: discountValue !== null ? String(Number(discountValue).toFixed(2)) : null }),
      ...(productId !== undefined && { productId: productId ? Number(productId) : null }),
      ...(stock !== undefined && { stock: stock !== null ? Number(stock) : null }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    })
    .where(and(eq(loyaltyRewardSchema.id, id), eq(loyaltyRewardSchema.organizationId, orgId)))
    .returning();

  return NextResponse.json(updated);
}

// DELETE /api/loyalty/rewards/:id — desactivar un premio (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Solo administradores pueden eliminar premios' }, { status: 403 });
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: loyaltyRewardSchema.id })
    .from(loyaltyRewardSchema)
    .where(and(eq(loyaltyRewardSchema.id, id), eq(loyaltyRewardSchema.organizationId, orgId)));

  if (!existing) {
    return NextResponse.json({ error: 'Premio no encontrado' }, { status: 404 });
  }

  await db
    .update(loyaltyRewardSchema)
    .set({ isActive: false })
    .where(eq(loyaltyRewardSchema.id, id));

  return NextResponse.json({ ok: true });
}
