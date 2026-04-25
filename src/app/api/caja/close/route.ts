import { auth } from '@clerk/nextjs/server';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { cashRegisterSessionSchema, saleSchema } from '@/models/Schema';

// POST /api/caja/close — close the current open session with a counted closing balance
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, closingBalance, closingPosnet, closingMercadopago, closingEnvios, notes } = body;

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

  // Only the user who opened the session or an admin can close it
  if (session.userId !== userId && orgRole !== 'org:admin') {
    return NextResponse.json(
      { error: 'Solo el usuario que abrió la caja o un administrador puede cerrarla' },
      { status: 403 },
    );
  }

  // Calculate sales totals from linked sales (cashRegisterSessionId)
  const totalsResult = await db
    .select({
      totalSales: sql<string>`COALESCE(SUM(${saleSchema.total}::numeric), 0)`,
      totalCash: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} = 'cash' THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
      totalTransfer: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} = 'transfer' THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
      totalCard: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} IN ('debit','credit') THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
    })
    .from(saleSchema)
    .where(eq(saleSchema.cashRegisterSessionId, Number(sessionId)));

  const totalSales = totalsResult[0]?.totalSales ?? '0';
  const totalCash = totalsResult[0]?.totalCash ?? '0';
  const totalTransfer = totalsResult[0]?.totalTransfer ?? '0';
  const totalCard = totalsResult[0]?.totalCard ?? '0';

  // Diferencias por método:
  // Efectivo: contado - (fondo inicial + ventas en efectivo)
  const expectedCash = Number(session.openingBalance) + Number(totalCash);
  const difference = Number(closingBalance) - expectedCash;

  // Posnet: contado - (fondo inicial + ventas con tarjeta debit/credit)
  const differencePosnet = closingPosnet != null
    ? Number(closingPosnet) - (Number(session.openingPosnet ?? 0) + Number(totalCard))
    : null;

  // MercadoPago: contado - (fondo inicial + ventas por transferencia)
  const differenceMercadopago = closingMercadopago != null
    ? Number(closingMercadopago) - (Number(session.openingMercadopago ?? 0) + Number(totalTransfer))
    : null;

  // Envíos: contado - fondo inicial (no hay método de venta mapeado)
  const differenceEnvios = closingEnvios != null
    ? Number(closingEnvios) - Number(session.openingEnvios ?? 0)
    : null;

  const hasDiscrepancy =
    Math.abs(difference) > 0.01
    || (differencePosnet != null && Math.abs(differencePosnet) > 0.01)
    || (differenceMercadopago != null && Math.abs(differenceMercadopago) > 0.01)
    || (differenceEnvios != null && Math.abs(differenceEnvios) > 0.01);

  const [closed] = await db
    .update(cashRegisterSessionSchema)
    .set({
      status: 'closed',
      closedByUserId: userId,
      closingBalance: String(closingBalance),
      closingPosnet: closingPosnet != null ? String(closingPosnet) : null,
      closingMercadopago: closingMercadopago != null ? String(closingMercadopago) : null,
      closingEnvios: closingEnvios != null ? String(closingEnvios) : null,
      totalSales,
      totalCash,
      totalTransfer,
      totalCard,
      difference: String(difference.toFixed(2)),
      differencePosnet: differencePosnet != null ? String(differencePosnet.toFixed(2)) : null,
      differenceMercadopago: differenceMercadopago != null ? String(differenceMercadopago.toFixed(2)) : null,
      differenceEnvios: differenceEnvios != null ? String(differenceEnvios.toFixed(2)) : null,
      notes: notes || null,
      closedAt: new Date(),
    })
    .where(eq(cashRegisterSessionSchema.id, Number(sessionId)))
    .returning();

  return NextResponse.json({ ...closed, hasDiscrepancy });
}
