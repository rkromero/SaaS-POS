import { auth } from '@clerk/nextjs/server';
import { and, eq, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { productSchema, stockSchema } from '@/models/Schema';

/**
 * GET /api/products/barcode/[code]?locationId=X
 *
 * Busca un producto activo por código de barras o SKU (fallback para
 * productos cargados antes de que existiera el campo barcode).
 *
 * Si se pasa locationId, devuelve también el stock actual en ese local.
 * Devuelve 404 si no existe, permitiendo al cliente ofrecer "crear producto".
 */
export async function GET(
  request: Request,
  { params }: { params: { code: string } },
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');
  const code = decodeURIComponent(params.code).trim();

  if (!code) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
  }

  // Busca por barcode primero, luego por SKU (retrocompatibilidad)
  const [product] = await db
    .select({
      id: productSchema.id,
      name: productSchema.name,
      price: productSchema.price,
      sku: productSchema.sku,
      barcode: productSchema.barcode,
    })
    .from(productSchema)
    .where(
      and(
        eq(productSchema.organizationId, orgId),
        eq(productSchema.isActive, true),
        or(
          eq(productSchema.barcode, code),
          eq(productSchema.sku, code),
        ),
      ),
    )
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  // Si hay locationId, incluye stock actual del local
  if (locationId) {
    const [stockRecord] = await db
      .select({ quantity: stockSchema.quantity })
      .from(stockSchema)
      .where(
        and(
          eq(stockSchema.productId, product.id),
          eq(stockSchema.locationId, Number(locationId)),
        ),
      )
      .limit(1);

    return NextResponse.json({ ...product, quantity: stockRecord?.quantity ?? 0 });
  }

  return NextResponse.json({ ...product, quantity: 0 });
}
