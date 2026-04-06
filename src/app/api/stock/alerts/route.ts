import { auth } from '@clerk/nextjs/server';
import { and, eq, lte } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { productSchema, stockSchema, userLocationSchema } from '@/models/Schema';

// GET /api/stock/alerts — products at or below their lowStockThreshold for the caller's location
export async function GET() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let locationId: number | null = null;
  if (orgRole !== 'org:admin') {
    const [assignment] = await db
      .select({ locationId: userLocationSchema.locationId })
      .from(userLocationSchema)
      .where(eq(userLocationSchema.userId, userId));
    if (!assignment) {
      return NextResponse.json([]);
    }
    locationId = assignment.locationId;
  }

  const baseSelect = {
    productId: productSchema.id,
    productName: productSchema.name,
    sku: productSchema.sku,
    quantity: stockSchema.quantity,
    lowStockThreshold: stockSchema.lowStockThreshold,
    locationId: stockSchema.locationId,
  };

  const alerts = locationId
    ? await db
      .select(baseSelect)
      .from(stockSchema)
      .innerJoin(productSchema, eq(productSchema.id, stockSchema.productId))
      .where(
        and(
          eq(productSchema.organizationId, orgId),
          eq(stockSchema.locationId, locationId),
          lte(stockSchema.quantity, stockSchema.lowStockThreshold),
        ),
      )
      .orderBy(stockSchema.quantity)
    : await db
      .select(baseSelect)
      .from(stockSchema)
      .innerJoin(productSchema, eq(productSchema.id, stockSchema.productId))
      .where(
        and(
          eq(productSchema.organizationId, orgId),
          lte(stockSchema.quantity, stockSchema.lowStockThreshold),
        ),
      )
      .orderBy(stockSchema.quantity);

  return NextResponse.json(alerts);
}
