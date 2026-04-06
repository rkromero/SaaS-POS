import { auth } from '@clerk/nextjs/server';
import { and, eq, like } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { customerSchema } from '@/models/Schema';

// GET /api/customers/search?whatsapp=XXXX
// Busca un cliente por número de WhatsApp dentro de la organización.
// Usado por el POS al seleccionar pago por fiado.
export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const whatsapp = searchParams.get('whatsapp')?.trim();

  if (!whatsapp || whatsapp.length < 6) {
    return NextResponse.json({ error: 'Número de WhatsApp inválido' }, { status: 400 });
  }

  // Normaliza: extrae solo los dígitos para comparar sin importar el formato
  const digits = whatsapp.replace(/\D/g, '');

  // Busca coincidencia por los últimos N dígitos (maneja prefijos de país distintos)
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
        // Busca por sufijo: clientes cuyo whatsapp termina con los dígitos ingresados
        like(customerSchema.whatsapp, `%${digits.slice(-8)}`),
      ),
    )
    .limit(5);

  if (customers.length === 0) {
    return NextResponse.json(null);
  }

  // Si hay exactamente uno, lo devuelve directamente
  if (customers.length === 1) {
    return NextResponse.json(customers[0]);
  }

  // Si hay varios, intenta hacer coincidir exactamente los últimos 10 dígitos
  const exact = customers.find(c =>
    c.whatsapp?.replace(/\D/g, '').endsWith(digits.slice(-10)),
  );

  return NextResponse.json(exact ?? customers[0]);
}
