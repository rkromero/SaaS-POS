import { auth } from '@clerk/nextjs/server';
import { and, eq, gte, lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  cashRegisterSessionSchema,
  locationSchema,
} from '@/models/Schema';

// GET /api/caja/consolidated?date=YYYY-MM-DD&locationId=X
// Admin-only: returns all sessions for a date with aggregated totals
export async function GET(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const locationIdParam = searchParams.get('locationId');

  // Resolve date range
  const day = dateParam ? new Date(dateParam) : new Date();
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  // Resolve locationId
  let locationId: number | null = null;
  if (locationIdParam) {
    locationId = Number(locationIdParam);
  } else {
    const [loc] = await db
      .select({ id: locationSchema.id })
      .from(locationSchema)
      .where(eq(locationSchema.organizationId, orgId))
      .limit(1);
    locationId = loc?.id ?? null;
  }

  if (!locationId) {
    return NextResponse.json({ sessions: [], totals: null });
  }

  // Verify location belongs to org
  const [location] = await db
    .select({ id: locationSchema.id, name: locationSchema.name })
    .from(locationSchema)
    .where(
      and(
        eq(locationSchema.id, locationId),
        eq(locationSchema.organizationId, orgId),
      ),
    );
  if (!location) {
    return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
  }

  // Fetch all sessions for the date at this location
  const sessions = await db
    .select()
    .from(cashRegisterSessionSchema)
    .where(
      and(
        eq(cashRegisterSessionSchema.locationId, locationId),
        gte(cashRegisterSessionSchema.openedAt, day),
        lt(cashRegisterSessionSchema.openedAt, nextDay),
      ),
    )
    .orderBy(cashRegisterSessionSchema.openedAt);

  // Aggregate totals from all closed sessions
  const totals = sessions.reduce(
    (acc, s) => {
      acc.totalSales += Number(s.totalSales ?? 0);
      acc.totalCash += Number(s.totalCash ?? 0);
      acc.totalCard += Number(s.totalCard ?? 0);
      acc.totalTransfer += Number(s.totalTransfer ?? 0);
      acc.totalDifference += Number(s.difference ?? 0);
      acc.totalDifferencePosnet += Number(s.differencePosnet ?? 0);
      acc.totalDifferenceMercadopago += Number(s.differenceMercadopago ?? 0);
      acc.totalDifferenceEnvios += Number(s.differenceEnvios ?? 0);
      return acc;
    },
    {
      totalSales: 0,
      totalCash: 0,
      totalCard: 0,
      totalTransfer: 0,
      totalDifference: 0,
      totalDifferencePosnet: 0,
      totalDifferenceMercadopago: 0,
      totalDifferenceEnvios: 0,
    },
  );

  const hasDiscrepancy =
    Math.abs(totals.totalDifference) > 0.01
    || Math.abs(totals.totalDifferencePosnet) > 0.01
    || Math.abs(totals.totalDifferenceMercadopago) > 0.01
    || Math.abs(totals.totalDifferenceEnvios) > 0.01;

  return NextResponse.json({
    location,
    date: day.toISOString().slice(0, 10),
    sessions,
    totals,
    hasDiscrepancy,
  });
}
