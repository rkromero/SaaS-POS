import { auth } from '@clerk/nextjs/server';
import { and, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { cashRegisterSessionSchema, saleSchema } from '@/models/Schema';

// POST /api/caja/close — close the current open session with a counted closing balance
export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, closingBalance, notes } = body;

  if (!sessionId || closingBalance === undefined) {
    return NextResponse.json(
      { error: 'sessionId y closingBalance son requeridos' },
      { status: 400 },
    );
  }

  // Fetch the session and verify it's open
  const [session] = await db
    .select()
    .from(cashRegisterSessionSchema)
    .where(eq(cashRegisterSessionSchema.id, Number(sessionId)));

  if (!session) {
    return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
  }
  if (session.status !== 'open') {
    return NextResponse.json({ error: 'La sesión ya está cerrada' }, { status: 409 });
  }

  // Calculate sales totals since session opened
  const totalsResult = await db
    .select({
      totalSales: sql<string>`COALESCE(SUM(${saleSchema.total}::numeric), 0)`,
      totalCash: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} = 'cash' THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
      totalTransfer: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} = 'transfer' THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
      totalCard: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} IN ('debit','credit') THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
    })
    .from(saleSchema)
    .where(
      and(
        eq(saleSchema.locationId, session.locationId),
        eq(saleSchema.status, 'completed'),
        gte(saleSchema.createdAt, session.openedAt),
      ),
    );

  const totalSales = totalsResult[0]?.totalSales ?? '0';
  const totalCash = totalsResult[0]?.totalCash ?? '0';
  const totalTransfer = totalsResult[0]?.totalTransfer ?? '0';
  const totalCard = totalsResult[0]?.totalCard ?? '0';

  // difference = lo que hay en caja (contado) - (fondo inicial + ventas en efectivo)
  const expectedCash = Number(session.openingBalance) + Number(totalCash);
  const difference = Number(closingBalance) - expectedCash;

  const [closed] = await db
    .update(cashRegisterSessionSchema)
    .set({
      status: 'closed',
      closedByUserId: userId,
      closingBalance: String(closingBalance),
      totalSales,
      totalCash,
      totalTransfer,
      totalCard,
      difference: String(difference.toFixed(2)),
      notes: notes || null,
      closedAt: new Date(),
    })
    .where(eq(cashRegisterSessionSchema.id, Number(sessionId)))
    .returning();

  return NextResponse.json(closed);
}
