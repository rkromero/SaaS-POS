import { auth } from '@clerk/nextjs/server';
import { and, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { loyaltyRewardSchema } from '@/models/Schema';

// GET /api/loyalty/rewards — listar premios de la org
// ?activeOnly=true para el POS (solo activos); sin filtro devuelve todos para admin
export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('activeOnly') === 'true';

  const conditions = [eq(loyaltyRewardSchema.organizationId, orgId)];
  if (activeOnly) {
    conditions.push(eq(loyaltyRewardSchema.isActive, true));
  }

  const rewards = await db
    .select()
    .from(loyaltyRewardSchema)
    .where(and(...conditions))
    .orderBy(asc(loyaltyRewardSchema.pointsCost));

  return NextResponse.json(rewards);
}

// POST /api/loyalty/rewards — crear un premio (solo admins)
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Solo administradores pueden crear premios' }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, type, pointsCost, discountValue, productId, stock } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }
  if (!['product', 'discount_fixed', 'discount_percent'].includes(type)) {
    return NextResponse.json({ error: 'Tipo de premio inválido' }, { status: 400 });
  }
  if (!pointsCost || Number(pointsCost) <= 0) {
    return NextResponse.json({ error: 'El costo en puntos debe ser mayor a 0' }, { status: 400 });
  }
  if (type !== 'product' && (!discountValue || Number(discountValue) <= 0)) {
    return NextResponse.json({ error: 'El valor de descuento es requerido para este tipo de premio' }, { status: 400 });
  }
  if (type === 'discount_percent' && Number(discountValue) > 100) {
    return NextResponse.json({ error: 'El porcentaje no puede superar 100' }, { status: 400 });
  }

  const [reward] = await db
    .insert(loyaltyRewardSchema)
    .values({
      organizationId: orgId,
      name: name.trim(),
      description: description?.trim() || null,
      type,
      pointsCost: Number(pointsCost),
      discountValue: discountValue !== undefined ? String(Number(discountValue).toFixed(2)) : null,
      productId: productId ? Number(productId) : null,
      stock: stock ? Number(stock) : null,
      isActive: true,
    })
    .returning();

  return NextResponse.json(reward, { status: 201 });
}
