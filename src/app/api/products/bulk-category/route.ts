import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { productSchema } from '@/models/Schema';

// POST /api/products/bulk-category
// Body: { productIds: number[], categoryId: number | null }
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { productIds, categoryId } = body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: 'Seleccioná al menos un producto' }, { status: 400 });
  }

  const updated = await db
    .update(productSchema)
    .set({ categoryId: categoryId ? Number(categoryId) : null })
    .where(
      and(
        eq(productSchema.organizationId, orgId),
        inArray(productSchema.id, productIds.map(Number)),
      ),
    )
    .returning();

  return NextResponse.json({ updated: updated.length });
}
