import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { categorySchema } from '@/models/Schema';

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

  const { name } = await request.json();
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  const [updated] = await db
    .update(categorySchema)
    .set({ name: name.trim() })
    .where(and(eq(categorySchema.id, id), eq(categorySchema.organizationId, orgId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

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
    .delete(categorySchema)
    .where(and(eq(categorySchema.id, id), eq(categorySchema.organizationId, orgId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
