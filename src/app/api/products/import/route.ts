import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { categorySchema, productSchema } from '@/models/Schema';

type ImportRow = {
  name: string;
  price: number;
  costPrice?: number;
  sku?: string;
  description?: string;
  category?: string;
};

// POST /api/products/import — bulk import products from parsed CSV rows (admin only)
// Body: { rows: ImportRow[] }
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { rows }: { rows: ImportRow[] } = body;

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No hay filas para importar' }, { status: 400 });
  }

  // Fetch existing categories for this org to resolve names → ids
  const categories = await db
    .select()
    .from(categorySchema)
    .where(eq(categorySchema.organizationId, orgId));

  const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

  // Collect unique category names that don't exist yet
  const newCategoryNames = [
    ...new Set(
      rows
        .map(r => r.category?.trim())
        .filter((n): n is string => !!n && !categoryMap.has(n.toLowerCase())),
    ),
  ];

  // Create missing categories
  if (newCategoryNames.length > 0) {
    const created = await db
      .insert(categorySchema)
      .values(newCategoryNames.map(name => ({ organizationId: orgId, name })))
      .returning();
    for (const c of created) {
      categoryMap.set(c.name.toLowerCase(), c.id);
    }
  }

  // Build insert values, skip rows with no name or invalid price
  const toInsert = rows
    .filter(r => r.name?.trim() && Number(r.price) > 0)
    .map(r => ({
      organizationId: orgId,
      name: r.name.trim(),
      price: String(Number(r.price).toFixed(2)),
      costPrice: r.costPrice ? String(Number(r.costPrice).toFixed(2)) : null,
      sku: r.sku?.trim() || null,
      description: r.description?.trim() || null,
      categoryId: r.category ? (categoryMap.get(r.category.trim().toLowerCase()) ?? null) : null,
    }));

  if (toInsert.length === 0) {
    return NextResponse.json({ error: 'Ninguna fila válida para importar' }, { status: 400 });
  }

  // Insert in batches of 100 to avoid query size limits
  let imported = 0;
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100);
    await db.insert(productSchema).values(batch);
    imported += batch.length;
  }

  return NextResponse.json({ imported, skipped: rows.length - imported });
}
