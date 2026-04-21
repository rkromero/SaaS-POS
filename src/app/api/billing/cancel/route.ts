import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { organizationSchema } from '@/models/Schema';

// POST /api/billing/cancel — cancel active subscription in MercadoPago and downgrade to free
export async function POST() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [org] = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId));

  if (!org?.mpPreapprovalId) {
    return NextResponse.json({ error: 'No hay suscripción activa' }, { status: 400 });
  }

  if (org.mpPlanStatus === 'cancelled') {
    return NextResponse.json({ error: 'La suscripción ya está cancelada' }, { status: 400 });
  }

  const mpToken = Env.MP_ACCESS_TOKEN;
  if (!mpToken) {
    return NextResponse.json({ error: 'Configuración de pago no disponible' }, { status: 500 });
  }

  // Cancel the preapproval in MercadoPago
  const response = await fetch(
    `https://api.mercadopago.com/preapproval/${org.mpPreapprovalId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpToken}`,
      },
      body: JSON.stringify({ status: 'cancelled' }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json(
      { error: 'Error al cancelar en Mercado Pago', details: error },
      { status: 500 },
    );
  }

  // Update DB immediately — don't wait for webhook confirmation
  await db
    .update(organizationSchema)
    .set({
      planType: 'free',
      mpPlanStatus: 'cancelled',
      planExpiresAt: null,
    })
    .where(eq(organizationSchema.id, orgId));

  return NextResponse.json({ success: true });
}
