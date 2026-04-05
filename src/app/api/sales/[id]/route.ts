import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { saleItemSchema, saleSchema } from '@/models/Schema';

// GET /api/sales/[id] — get full sale with items (for ticket reprint)
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const [sale] = await db
    .select()
    .from(saleSchema)
    .where(and(eq(saleSchema.id, id), eq(saleSchema.organizationId, orgId)));

  if (!sale) {
    return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
  }

  const items = await db
    .select()
    .from(saleItemSchema)
    .where(eq(saleItemSchema.saleId, id));

  return NextResponse.json({ sale, items });
}
