import { auth } from '@clerk/nextjs/server';
import { count, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { getOrgAccess } from '@/libs/OrgAccess';
import { locationSchema } from '@/models/Schema';

// GET /api/locations — list all locations for the current organization
export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const locations = await db
    .select()
    .from(locationSchema)
    .where(eq(locationSchema.organizationId, orgId))
    .orderBy(locationSchema.createdAt);

  // Cache 60s en el browser: los locales casi nunca cambian durante el día
  return NextResponse.json(locations, {
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
  });
}

// POST /api/locations — create a new location (admin only)
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, address } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  // ── Verificar límite de locales según el plan ─────────────────────────────
  const [access, locationCountResult] = await Promise.all([
    getOrgAccess(orgId),
    db.select({ locationCount: count() })
      .from(locationSchema)
      .where(eq(locationSchema.organizationId, orgId)),
  ]);

  const locationCount = locationCountResult[0]?.locationCount ?? 0;

  if (!access.canAddLocation(locationCount)) {
    return NextResponse.json(
      {
        error: access.locationLimitMessage,
        code: 'PLAN_LIMIT_LOCATIONS',
        current: locationCount,
        limit: access.maxLocations,
      },
      { status: 403 },
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  const [location] = await db
    .insert(locationSchema)
    .values({
      organizationId: orgId,
      name: name.trim(),
      address: address?.trim() || null,
    })
    .returning();

  return NextResponse.json(location, { status: 201 });
}
