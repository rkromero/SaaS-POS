import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { locationSchema } from '@/models/Schema';

// PUT /api/locations/[id] — update a location (admin only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const body = await request.json();
  const { name, address, isActive } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  const [updated] = await db
    .update(locationSchema)
    .set({
      name: name.trim(),
      address: address?.trim() || null,
      isActive: isActive ?? true,
    })
    .where(
      and(
        eq(locationSchema.id, id),
        eq(locationSchema.organizationId, orgId),
      ),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/locations/[id] — delete a location (admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const [deleted] = await db
    .delete(locationSchema)
    .where(
      and(
        eq(locationSchema.id, id),
        eq(locationSchema.organizationId, orgId),
      ),
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
