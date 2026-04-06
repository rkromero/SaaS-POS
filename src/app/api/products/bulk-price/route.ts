import { auth } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { productSchema } from '@/models/Schema';

// POST /api/products/bulk-price — apply a percentage adjustment to product prices (admin only)
// Body: { percentage: number, categoryId?: number }
// percentage = 15 means +15%, -10 means -10%
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { percentage, categoryId } = body;

  if (percentage === undefined || percentage === 0) {
    return NextResponse.json(
      { error: 'percentage es requerido y debe ser distinto de 0' },
      { status: 400 },
    );
  }

  const multiplier = 1 + Number(percentage) / 100;

  const baseQuery = db
    .update(productSchema)
    .set({
      // Round to 2 decimal places after applying multiplier
      price: sql`ROUND((${productSchema.price}::numeric * ${multiplier}), 2)`,
    });

  const updated = categoryId
    ? await baseQuery
      .where(
        and(
          eq(productSchema.organizationId, orgId),
          eq(productSchema.isActive, true),
          eq(productSchema.categoryId, Number(categoryId)),
        ),
      )
      .returning()
    : await baseQuery
      .where(
        and(
          eq(productSchema.organizationId, orgId),
          eq(productSchema.isActive, true),
        ),
      )
      .returning();

  return NextResponse.json({ updated: updated.length });
}
