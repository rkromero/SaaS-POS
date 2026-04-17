import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { getOrgAccess } from '@/libs/OrgAccess';
import { promotionComboItemSchema, promotionSchema } from '@/models/Schema';

function isPromotionsEnabled(access: Awaited<ReturnType<typeof getOrgAccess>>) {
  return access.isProOrBetter || access.hasModule('promotions');
}

// PUT /api/promotions/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Solo administradores pueden editar promociones' }, { status: 403 });
  }

  const access = await getOrgAccess(orgId);
  if (!isPromotionsEnabled(access)) {
    return NextResponse.json({ error: 'Plan Pro o superior requerido' }, { status: 403 });
  }

  const promoId = Number(params.id);
  const [existing] = await db
    .select({ id: promotionSchema.id, type: promotionSchema.type })
    .from(promotionSchema)
    .where(and(eq(promotionSchema.id, promoId), eq(promotionSchema.organizationId, orgId)));

  if (!existing) {
    return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 });
  }

  const body = await request.json();
  const {
    name,
    description,
    isActive,
    isStackable,
    startsAt,
    endsAt,
    targetProductId,
    promoPrice,
    discountType,
    discountValue,
    discountScope,
    targetCategoryId,
    comboPrice,
    comboItems,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }
  if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
    return NextResponse.json({ error: 'La fecha de fin debe ser posterior a la de inicio' }, { status: 400 });
  }

  // For combo type: replace items
  if (existing.type === 'combo') {
    if (!Array.isArray(comboItems) || comboItems.length < 2) {
      return NextResponse.json({ error: 'Un combo debe tener al menos 2 productos' }, { status: 400 });
    }
    await db
      .delete(promotionComboItemSchema)
      .where(eq(promotionComboItemSchema.promotionId, promoId));
    await db.insert(promotionComboItemSchema).values(
      comboItems.map((item: { productId: number; quantity: number }) => ({
        promotionId: promoId,
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      })),
    );
  }

  const [updated] = await db
    .update(promotionSchema)
    .set({
      name: name.trim(),
      description: description?.trim() || null,
      isActive: isActive ?? true,
      isStackable: isStackable ?? false,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      targetProductId: targetProductId ? Number(targetProductId) : null,
      promoPrice: promoPrice ? String(Number(promoPrice).toFixed(2)) : null,
      discountType: discountType ?? null,
      discountValue: discountValue ? String(Number(discountValue).toFixed(2)) : null,
      discountScope: discountScope ?? null,
      targetCategoryId: targetCategoryId ? Number(targetCategoryId) : null,
      comboPrice: comboPrice ? String(Number(comboPrice).toFixed(2)) : null,
    })
    .where(and(eq(promotionSchema.id, promoId), eq(promotionSchema.organizationId, orgId)))
    .returning();

  return NextResponse.json(updated);
}

// DELETE /api/promotions/[id]
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Solo administradores pueden eliminar promociones' }, { status: 403 });
  }

  const promoId = Number(params.id);
  const deleted = await db
    .delete(promotionSchema)
    .where(and(eq(promotionSchema.id, promoId), eq(promotionSchema.organizationId, orgId)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
