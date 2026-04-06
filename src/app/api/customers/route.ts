import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { customerSchema } from '@/models/Schema';

// POST /api/customers — dar de alta un cliente con WhatsApp obligatorio
export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, whatsapp, email } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  const digits = whatsapp?.replace(/\D/g, '') ?? '';
  if (digits.length < 6) {
    return NextResponse.json(
      { error: 'El número de WhatsApp es requerido y debe ser válido' },
      { status: 400 },
    );
  }

  // Verifica que no exista otro cliente con el mismo WhatsApp en la org
  const existing = await db
    .select({ id: customerSchema.id, name: customerSchema.name })
    .from(customerSchema)
    .where(
      and(
        eq(customerSchema.organizationId, orgId),
        eq(customerSchema.whatsapp, digits),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: `Ya existe un cliente con ese WhatsApp: ${existing[0]!.name}` },
      { status: 409 },
    );
  }

  const [customer] = await db
    .insert(customerSchema)
    .values({
      organizationId: orgId,
      name: name.trim(),
      whatsapp: digits,
      email: email?.trim() || null,
    })
    .returning();

  return NextResponse.json(customer, { status: 201 });
}
