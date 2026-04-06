import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { supplierSchema } from '@/models/Schema';

// GET /api/suppliers — list all active suppliers for the org
export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const suppliers = await db
    .select()
    .from(supplierSchema)
    .where(eq(supplierSchema.organizationId, orgId))
    .orderBy(supplierSchema.name);

  return NextResponse.json(suppliers);
}

// POST /api/suppliers — create a supplier (admin only)
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, contactName, phone, email, notes } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  const [supplier] = await db
    .insert(supplierSchema)
    .values({
      organizationId: orgId,
      name: name.trim(),
      contactName: contactName?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      notes: notes?.trim() || null,
    })
    .returning();

  return NextResponse.json(supplier, { status: 201 });
}
