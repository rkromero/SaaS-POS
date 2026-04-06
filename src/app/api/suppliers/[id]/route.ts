import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { supplierSchema } from '@/models/Schema';

// PUT /api/suppliers/[id] — update a supplier (admin only)
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

  const body = await request.json();
  const { name, contactName, phone, email, notes, isActive } = body;

  const [updated] = await db
    .update(supplierSchema)
    .set({
      name: name?.trim(),
      contactName: contactName?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      notes: notes?.trim() || null,
      ...(isActive !== undefined ? { isActive } : {}),
    })
    .where(
      and(
        eq(supplierSchema.id, Number(params.id)),
        eq(supplierSchema.organizationId, orgId),
      ),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/suppliers/[id] — soft-delete (deactivate) a supplier (admin only)
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

  await db
    .update(supplierSchema)
    .set({ isActive: false })
    .where(
      and(
        eq(supplierSchema.id, Number(params.id)),
        eq(supplierSchema.organizationId, orgId),
      ),
    );

  return NextResponse.json({ success: true });
}
