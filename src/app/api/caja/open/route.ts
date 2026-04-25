import { auth } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  cashRegisterSessionSchema,
  locationSchema,
  saleSchema,
  userLocationSchema,
} from '@/models/Schema';

// POST /api/caja/open — open a cash register session for the current user
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    openingBalance,
    openingPosnet,
    openingMercadopago,
    openingEnvios,
    locationId: bodyLocationId,
  } = body;

  if (openingBalance === undefined || openingBalance === null) {
    return NextResponse.json({ error: 'openingBalance es requerido' }, { status: 400 });
  }

  // Resolve locationId
  let resolvedLocationId: number;
  if (orgRole === 'org:admin') {
    if (bodyLocationId) {
      resolvedLocationId = Number(bodyLocationId);
    } else {
      const [loc] = await db
        .select({ id: locationSchema.id })
        .from(locationSchema)
        .where(eq(locationSchema.organizationId, orgId))
        .limit(1);
      if (!loc) {
        return NextResponse.json({ error: 'No hay locales configurados' }, { status: 403 });
      }
      resolvedLocationId = loc.id;
    }
  } else {
    const [assignment] = await db
      .select({ locationId: userLocationSchema.locationId })
      .from(userLocationSchema)
      .where(eq(userLocationSchema.userId, userId));
    if (!assignment) {
      return NextResponse.json({ error: 'Sin local asignado' }, { status: 403 });
    }
    resolvedLocationId = assignment.locationId;
  }

  // Validate location belongs to org
  const [location] = await db
    .select()
    .from(locationSchema)
    .where(
      and(
        eq(locationSchema.id, resolvedLocationId),
        eq(locationSchema.organizationId, orgId),
      ),
    );
  if (!location) {
    return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
  }

  // Check for existing open session for THIS USER (not location-wide)
  const [existing] = await db
    .select()
    .from(cashRegisterSessionSchema)
    .where(
      and(
        eq(cashRegisterSessionSchema.userId, userId),
        eq(cashRegisterSessionSchema.status, 'open'),
      ),
    );

  // Auto-close stale session (>10 hours) if found
  if (existing) {
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
    if (existing.openedAt <= tenHoursAgo) {
      // Auto-close the stale session
      const totalsResult = await db
        .select({
          totalSales: sql<string>`COALESCE(SUM(${saleSchema.total}::numeric), 0)`,
          totalCash: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} = 'cash' THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
          totalTransfer: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} = 'transfer' THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
          totalCard: sql<string>`COALESCE(SUM(CASE WHEN ${saleSchema.paymentMethod} IN ('debit','credit') THEN ${saleSchema.total}::numeric ELSE 0 END), 0)`,
        })
        .from(saleSchema)
        .where(eq(saleSchema.cashRegisterSessionId, existing.id));

      await db
        .update(cashRegisterSessionSchema)
        .set({
          status: 'auto_closed',
          closedByUserId: 'system',
          totalSales: totalsResult[0]?.totalSales ?? '0',
          totalCash: totalsResult[0]?.totalCash ?? '0',
          totalTransfer: totalsResult[0]?.totalTransfer ?? '0',
          totalCard: totalsResult[0]?.totalCard ?? '0',
          notes: 'Cierre automático: la sesión estuvo abierta más de 10 horas',
          closedAt: new Date(),
        })
        .where(eq(cashRegisterSessionSchema.id, existing.id));
    } else {
      return NextResponse.json(
        { error: 'Ya tenés una caja abierta. Cerrala antes de abrir una nueva.' },
        { status: 409 },
      );
    }
  }

  const [session] = await db
    .insert(cashRegisterSessionSchema)
    .values({
      locationId: resolvedLocationId,
      userId,
      openingBalance: String(openingBalance),
      openingPosnet: openingPosnet != null ? String(openingPosnet) : null,
      openingMercadopago: openingMercadopago != null ? String(openingMercadopago) : null,
      openingEnvios: openingEnvios != null ? String(openingEnvios) : null,
      status: 'open',
    })
    .returning();

  return NextResponse.json(session, { status: 201 });
}
