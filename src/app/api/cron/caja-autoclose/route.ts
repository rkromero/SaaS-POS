// Cron job: auto-closes cash register sessions open for more than 10 hours.
// Protected with CRON_SECRET. Runs every 30 minutes via vercel.json.

import { and, eq, lte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { cashRegisterSessionSchema, saleSchema } from '@/models/Schema';

export async function POST(request: Request) {
  // Vercel cron sends GET, but also support POST for manual trigger
  return handleAutoClose(request);
}

export async function GET(request: Request) {
  return handleAutoClose(request);
}

async function handleAutoClose(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (Env.CRON_SECRET && authHeader !== `Bearer ${Env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);

  // Find all sessions open for more than 10 hours
  const staleSessions = await db
    .select()
    .from(cashRegisterSessionSchema)
    .where(
      and(
        eq(cashRegisterSessionSchema.status, 'open'),
        lte(cashRegisterSessionSchema.openedAt, tenHoursAgo),
      ),
    );

  const results: { sessionId: number; userId: string; totalSales: string }[] = [];

  for (const session of staleSessions) {
    // Calculate totals from linked sales
    const totalsResult = await db
      .select({
        totalSales: sql<string>`COALESCE(SUM(${saleSchema.total}::numeric), 0)`,
        totalCash: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} = 'cash' THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
        totalTransfer: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} = 'transfer' THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
        totalCard: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} IN ('debit','credit') THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
      })
      .from(saleSchema)
      .where(eq(saleSchema.cashRegisterSessionId, session.id));

    const totalSales = totalsResult[0]?.totalSales ?? '0';
    const totalCash = totalsResult[0]?.totalCash ?? '0';
    const totalTransfer = totalsResult[0]?.totalTransfer ?? '0';
    const totalCard = totalsResult[0]?.totalCard ?? '0';

    // Auto-close: no closing balances (user wasn't present to count)
    await db
      .update(cashRegisterSessionSchema)
      .set({
        status: 'auto_closed',
        closedByUserId: 'system',
        totalSales,
        totalCash,
        totalTransfer,
        totalCard,
        difference: null,
        differencePosnet: null,
        differenceMercadopago: null,
        differenceEnvios: null,
        notes: 'Cierre automático: la sesión estuvo abierta más de 10 horas',
        closedAt: new Date(),
      })
      .where(eq(cashRegisterSessionSchema.id, session.id));

    results.push({ sessionId: session.id, userId: session.userId, totalSales });
  }

  return NextResponse.json({
    message: `Auto-closed ${results.length} sessions`,
    sessions: results,
  });
}
