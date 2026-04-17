import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  loyaltyConfigSchema,
  loyaltyRedemptionSchema,
  loyaltyTransactionSchema,
  saleItemSchema,
  saleSchema,
} from '@/models/Schema';

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

// PATCH /api/sales/[id] — cancelar una venta y revertir puntos de fidelización
export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Solo administradores pueden cancelar ventas' }, { status: 403 });
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
  if (sale.status === 'cancelled') {
    return NextResponse.json({ error: 'La venta ya está cancelada' }, { status: 400 });
  }

  // Cancelar la venta
  await db
    .update(saleSchema)
    .set({ status: 'cancelled' })
    .where(eq(saleSchema.id, id));

  // ── Loyalty: revertir puntos asociados a esta venta ───────────────────────
  const [loyaltyConfig] = await db
    .select({ isActive: loyaltyConfigSchema.isActive })
    .from(loyaltyConfigSchema)
    .where(eq(loyaltyConfigSchema.organizationId, orgId));

  if (loyaltyConfig?.isActive) {
    // Buscar transacciones de earn y redemptions vinculadas a esta venta
    const [earnTx, redemption] = await Promise.all([
      db.select()
        .from(loyaltyTransactionSchema)
        .where(and(
          eq(loyaltyTransactionSchema.saleId, id),
          eq(loyaltyTransactionSchema.type, 'earn'),
          eq(loyaltyTransactionSchema.organizationId, orgId),
        )),
      db.select()
        .from(loyaltyRedemptionSchema)
        .where(and(
          eq(loyaltyRedemptionSchema.saleId, id),
          eq(loyaltyRedemptionSchema.organizationId, orgId),
          eq(loyaltyRedemptionSchema.status, 'completed'),
        )),
    ]);

    const reversals: Promise<unknown>[] = [];

    // Revertir puntos ganados en esta venta (insertar débito equivalente)
    for (const tx of earnTx) {
      if (tx.points > 0) {
        reversals.push(
          db.insert(loyaltyTransactionSchema).values({
            organizationId: orgId,
            customerId: tx.customerId,
            type: 'adjust',
            points: -tx.points,
            saleId: id,
            description: `Reversa por anulación de venta ${sale.receiptNumber}`,
            userId,
          }),
        );
      }
    }

    // Reintegrar puntos canjeados en esta venta (insertar crédito equivalente)
    for (const r of redemption) {
      reversals.push(
        db.insert(loyaltyTransactionSchema).values({
          organizationId: orgId,
          customerId: r.customerId,
          type: 'adjust',
          points: r.pointsSpent,
          saleId: id,
          description: `Reintegro por anulación: canje "${r.rewardName}" (${sale.receiptNumber})`,
          userId,
        }),
        db.update(loyaltyRedemptionSchema)
          .set({ status: 'cancelled' })
          .where(eq(loyaltyRedemptionSchema.id, r.id)),
      );
    }

    if (reversals.length > 0) {
      await Promise.all(reversals);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  return NextResponse.json({ ok: true, status: 'cancelled' });
}
