import { auth } from '@clerk/nextjs/server';
import { and, eq, ilike, like, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { customerSchema } from '@/models/Schema';

// GET /api/customers/search?q=XXX   — busca por nombre O teléfono, devuelve array (usado por el selector de cliente del POS)
// GET /api/customers/search?whatsapp=XXXX — busca exacto por WhatsApp, devuelve un cliente o null (usado por el flujo de fidelización)
export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const whatsapp = searchParams.get('whatsapp')?.trim();

  // ── Modo q: búsqueda libre por nombre O teléfono ──────────────────────────
  if (q) {
    if (q.length < 2) {
      return NextResponse.json([]);
    }
    const digits = q.replace(/\D/g, '');
    const conditions = [ilike(customerSchema.name, `%${q}%`)];
    if (digits.length >= 4) {
      conditions.push(like(customerSchema.whatsapp, `%${digits.slice(-8)}`));
    }
    const results = await db
      .select({
        id: customerSchema.id,
        name: customerSchema.name,
        whatsapp: customerSchema.whatsapp,
        email: customerSchema.email,
      })
      .from(customerSchema)
      .where(and(eq(customerSchema.organizationId, orgId), or(...conditions)))
      .limit(6);
    return NextResponse.json(results);
  }

  // ── Modo whatsapp: búsqueda exacta por teléfono (backward compat) ──────────
  if (!whatsapp || whatsapp.length < 6) {
    return NextResponse.json({ error: 'Parámetro requerido: q o whatsapp' }, { status: 400 });
  }

  const digits = whatsapp.replace(/\D/g, '');

  const customers = await db
    .select({
      id: customerSchema.id,
      name: customerSchema.name,
      whatsapp: customerSchema.whatsapp,
      email: customerSchema.email,
    })
    .from(customerSchema)
    .where(
      and(
        eq(customerSchema.organizationId, orgId),
        like(customerSchema.whatsapp, `%${digits.slice(-8)}`),
      ),
    )
    .limit(5);

  if (customers.length === 0) {
    return NextResponse.json(null);
  }

  if (customers.length === 1) {
    return NextResponse.json(customers[0]);
  }

  const exact = customers.find(c =>
    c.whatsapp?.replace(/\D/g, '').endsWith(digits.slice(-10)),
  );

  return NextResponse.json(exact ?? customers[0]);
}
