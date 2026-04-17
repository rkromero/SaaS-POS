import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { getOrgAccess } from '@/libs/OrgAccess';
import {
  categorySchema,
  productSchema,
  promotionComboItemSchema,
  promotionSchema,
} from '@/models/Schema';

function isPromotionsEnabled(access: Awaited<ReturnType<typeof getOrgAccess>>) {
  return access.isProOrBetter || access.hasModule('promotions');
}

// GET /api/promotions — list all promotions for the org
export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getOrgAccess(orgId);
  if (!isPromotionsEnabled(access)) {
    return NextResponse.json({ error: 'Plan Pro o superior requerido' }, { status: 403 });
  }

  const [promotions, comboItems] = await Promise.all([
    db
      .select({
        id: promotionSchema.id,
        name: promotionSchema.name,
        description: promotionSchema.description,
        type: promotionSchema.type,
        isActive: promotionSchema.isActive,
        isStackable: promotionSchema.isStackable,
        startsAt: promotionSchema.startsAt,
        endsAt: promotionSchema.endsAt,
        targetProductId: promotionSchema.targetProductId,
        targetProductName: productSchema.name,
        promoPrice: promotionSchema.promoPrice,
        discountType: promotionSchema.discountType,
        discountValue: promotionSchema.discountValue,
        discountScope: promotionSchema.discountScope,
        targetCategoryId: promotionSchema.targetCategoryId,
        targetCategoryName: categorySchema.name,
        comboPrice: promotionSchema.comboPrice,
        createdAt: promotionSchema.createdAt,
        updatedAt: promotionSchema.updatedAt,
      })
      .from(promotionSchema)
      .leftJoin(productSchema, eq(promotionSchema.targetProductId, productSchema.id))
      .leftJoin(categorySchema, eq(promotionSchema.targetCategoryId, categorySchema.id))
      .where(eq(promotionSchema.organizationId, orgId))
      .orderBy(promotionSchema.createdAt),

    db
      .select({
        promotionId: promotionComboItemSchema.promotionId,
        id: promotionComboItemSchema.id,
        productId: promotionComboItemSchema.productId,
        productName: productSchema.name,
        quantity: promotionComboItemSchema.quantity,
      })
      .from(promotionComboItemSchema)
      .innerJoin(productSchema, eq(promotionComboItemSchema.productId, productSchema.id))
      .innerJoin(promotionSchema, eq(promotionComboItemSchema.promotionId, promotionSchema.id))
      .where(eq(promotionSchema.organizationId, orgId)),
  ]);

  // Attach combo items to their promotions
  const comboItemsByPromo = comboItems.reduce<Record<number, typeof comboItems>>((acc, item) => {
    (acc[item.promotionId] ??= []).push(item);
    return acc;
  }, {});

  const result = promotions.map(p => ({
    ...p,
    comboItems: comboItemsByPromo[p.id] ?? [],
  }));

  return NextResponse.json(result);
}

// POST /api/promotions — create a promotion
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Solo administradores pueden crear promociones' }, { status: 403 });
  }

  const access = await getOrgAccess(orgId);
  if (!isPromotionsEnabled(access)) {
    return NextResponse.json({ error: 'Plan Pro o superior requerido' }, { status: 403 });
  }

  const body = await request.json();
  const {
    name,
    description,
    type,
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

  if (!name?.trim() || !type) {
    return NextResponse.json({ error: 'Nombre y tipo son requeridos' }, { status: 400 });
  }
  if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
    return NextResponse.json({ error: 'La fecha de fin debe ser posterior a la de inicio' }, { status: 400 });
  }

  // Type-specific validations
  if (type === 'product_price') {
    if (!targetProductId || !promoPrice || Number(promoPrice) <= 0) {
      return NextResponse.json({ error: 'Se requiere producto y precio promocional positivo' }, { status: 400 });
    }
  } else if (type === 'discount') {
    if (!discountType || !discountValue || Number(discountValue) <= 0) {
      return NextResponse.json({ error: 'Se requiere tipo y valor de descuento positivo' }, { status: 400 });
    }
    if (!discountScope) {
      return NextResponse.json({ error: 'Se requiere alcance del descuento' }, { status: 400 });
    }
    if (discountScope === 'product' && !targetProductId) {
      return NextResponse.json({ error: 'Se requiere un producto objetivo' }, { status: 400 });
    }
    if (discountScope === 'category' && !targetCategoryId) {
      return NextResponse.json({ error: 'Se requiere una categoría objetivo' }, { status: 400 });
    }
    if (discountType === 'percent' && Number(discountValue) > 100) {
      return NextResponse.json({ error: 'El porcentaje no puede superar 100' }, { status: 400 });
    }
  } else if (type === 'combo') {
    if (!comboPrice || Number(comboPrice) <= 0) {
      return NextResponse.json({ error: 'Se requiere precio de combo positivo' }, { status: 400 });
    }
    if (!Array.isArray(comboItems) || comboItems.length < 2) {
      return NextResponse.json({ error: 'Un combo debe tener al menos 2 productos' }, { status: 400 });
    }
    for (const item of comboItems) {
      if (!item.productId || !item.quantity || Number(item.quantity) < 1) {
        return NextResponse.json({ error: 'Cada producto del combo necesita cantidad ≥ 1' }, { status: 400 });
      }
    }
  }

  const [promo] = await db
    .insert(promotionSchema)
    .values({
      organizationId: orgId,
      name: name.trim(),
      description: description?.trim() || null,
      type,
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
    .returning();

  if (type === 'combo' && Array.isArray(comboItems) && comboItems.length > 0) {
    await db.insert(promotionComboItemSchema).values(
      comboItems.map((item: { productId: number; quantity: number }) => ({
        promotionId: promo!.id,
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      })),
    );
  }

  return NextResponse.json(promo, { status: 201 });
}
