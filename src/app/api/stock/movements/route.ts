import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { locationSchema, stockMovementSchema, stockSchema } from '@/models/Schema';

// GET /api/stock/movements?stockId=X — movement history for a stock record
export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stockId = searchParams.get('stockId');

  if (!stockId) {
    return NextResponse.json({ error: 'stockId requerido' }, { status: 400 });
  }

  // Verify the stock record belongs to this org via location
  const [stock] = await db
    .select()
    .from(stockSchema)
    .innerJoin(locationSchema, eq(stockSchema.locationId, locationSchema.id))
    .where(
      and(
        eq(stockSchema.id, Number(stockId)),
        eq(locationSchema.organizationId, orgId),
      ),
    );

  if (!stock) {
    return NextResponse.json({ error: 'Stock no encontrado' }, { status: 404 });
  }

  const movements = await db
    .select()
    .from(stockMovementSchema)
    .where(eq(stockMovementSchema.stockId, Number(stockId)))
    .orderBy(desc(stockMovementSchema.createdAt))
    .limit(50);

  return NextResponse.json(movements);
}
