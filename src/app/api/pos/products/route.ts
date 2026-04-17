import { auth } from '@clerk/nextjs/server';
import { and, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { getOrgAccess } from '@/libs/OrgAccess';
import {
  categorySchema,
  locationSchema,
  productSchema,
  promotionComboItemSchema,
  promotionSchema,
  stockSchema,
} from '@/models/Schema';

// GET /api/pos/products?locationId=X
// Returns active products with stock, active combos, and active discount/price promotions
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

  const now = new Date();

  const [access, locationResult, products] = await Promise.all([
    getOrgAccess(orgId),

    db
      .select({ id: locationSchema.id })
      .from(locationSchema)
      .where(
        and(
          eq(locationSchema.id, Number(locationId)),
          eq(locationSchema.organizationId, orgId),
        ),
      )
      .limit(1),

    db
      .select({
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

  // If promotions module is not enabled, return the legacy shape (just products array)
  const promotionsEnabled = access.isProOrBetter || access.hasModule('promotions');
  if (!promotionsEnabled) {
    return NextResponse.json(products, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });
  }

  // Fetch active promos: product_price, discount, and combo
  const activePromoWhere = and(
    eq(promotionSchema.organizationId, orgId),
    eq(promotionSchema.isActive, true),
    or(isNull(promotionSchema.startsAt), lte(promotionSchema.startsAt, now)),
    or(isNull(promotionSchema.endsAt), gte(promotionSchema.endsAt, now)),
  );

  const [productPricePromos, discountPromos, comboRows] = await Promise.all([
    db
      .select({
        id: promotionSchema.id,
        name: promotionSchema.name,
        targetProductId: promotionSchema.targetProductId,
        promoPrice: promotionSchema.promoPrice,
        isStackable: promotionSchema.isStackable,
      })
      .from(promotionSchema)
      .where(and(activePromoWhere, eq(promotionSchema.type, 'product_price'))),

    db
      .select({
        id: promotionSchema.id,
        name: promotionSchema.name,
        isStackable: promotionSchema.isStackable,
        discountType: promotionSchema.discountType,
        discountValue: promotionSchema.discountValue,
        discountScope: promotionSchema.discountScope,
        targetProductId: promotionSchema.targetProductId,
        targetCategoryId: promotionSchema.targetCategoryId,
      })
      .from(promotionSchema)
      .where(and(activePromoWhere, eq(promotionSchema.type, 'discount'))),

    // Combo rows: one row per combo×item — grouped in app code
    db
      .select({
        comboId: promotionSchema.id,
        comboName: promotionSchema.name,
        comboDescription: promotionSchema.description,
        comboPrice: promotionSchema.comboPrice,
        isStackable: promotionSchema.isStackable,
        itemId: promotionComboItemSchema.id,
        itemProductId: promotionComboItemSchema.productId,
        itemQuantity: promotionComboItemSchema.quantity,
        productName: productSchema.name,
        stock: stockSchema.quantity,
      })
      .from(promotionSchema)
      .innerJoin(
        promotionComboItemSchema,
        eq(promotionComboItemSchema.promotionId, promotionSchema.id),
      )
      .innerJoin(productSchema, eq(productSchema.id, promotionComboItemSchema.productId))
      .leftJoin(
        stockSchema,
        and(
          eq(stockSchema.productId, promotionComboItemSchema.productId),
          eq(stockSchema.locationId, Number(locationId)),
        ),
      )
      .where(and(activePromoWhere, eq(promotionSchema.type, 'combo'))),
  ]);

  // Apply product_price promos to products (override price where applicable)
  const productPriceMap = new Map(
    productPricePromos
      .filter(p => p.targetProductId !== null)
      .map(p => [p.targetProductId!, p]),
  );

  const enrichedProducts = products.map((p) => {
    const promo = productPriceMap.get(p.id);
    return promo
      ? { ...p, promoPrice: promo.promoPrice, promoName: promo.name, promoId: promo.id }
      : { ...p, promoPrice: null, promoName: null, promoId: null };
  });

  // Group combo rows into combo objects
  const comboMap = new Map<number, {
    id: number;
    name: string;
    description: string | null;
    comboPrice: string | null;
    isStackable: boolean;
    items: { productId: number; productName: string; quantity: number; stock: number | null }[];
  }>();

  for (const row of comboRows) {
    if (!comboMap.has(row.comboId)) {
      comboMap.set(row.comboId, {
        id: row.comboId,
        name: row.comboName,
        description: row.comboDescription,
        comboPrice: row.comboPrice,
        isStackable: row.isStackable,
        items: [],
      });
    }
    comboMap.get(row.comboId)!.items.push({
      productId: row.itemProductId,
      productName: row.productName,
      quantity: row.itemQuantity,
      stock: row.stock,
    });
  }

  return NextResponse.json(
    {
      products: enrichedProducts,
      combos: [...comboMap.values()],
      promotions: discountPromos,
    },
    { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } },
  );
}
