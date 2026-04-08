import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { mpNotificationSchema, organizationSchema } from '@/models/Schema';

type MpWebhookBody = {
  id?: string | number;
  action?: string;
  type?: string;
  topic?: string;
  data?: { id: string };
  user_id?: string | number;
  live_mode?: boolean;
};

// POST /api/webhooks/mp — recibe notificaciones de Mercado Pago
// MP llama este endpoint cuando hay un pago, orden o transferencia
export async function POST(request: Request) {
  let body: MpWebhookBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // MP puede enviar el topic como campo top-level o dentro del tipo de acción
  const topic = body.topic ?? body.type ?? 'unknown';
  const action = body.action ?? null;
  const resourceId = body.data?.id ?? String(body.id ?? '');
  const mpUserId = String(body.user_id ?? '');
  const notificationId = `${topic}-${resourceId}-${action ?? 'na'}`;

  // Ignorar notificaciones de prueba o sin user_id
  if (!mpUserId || mpUserId === '0') {
    return NextResponse.json({ received: true });
  }

  // Encontrar la org que tiene este MP user_id
  const [org] = await db
    .select({
      id: organizationSchema.id,
      mpOauthAccessToken: organizationSchema.mpOauthAccessToken,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.mpOauthUserId, mpUserId));

  if (!org?.mpOauthAccessToken) {
    // No tenemos esta cuenta registrada — ignorar
    return NextResponse.json({ received: true });
  }

  // Evitar duplicados (puede llegar el mismo evento más de una vez)
  const [existing] = await db
    .select({ id: mpNotificationSchema.id })
    .from(mpNotificationSchema)
    .where(
      and(
        eq(mpNotificationSchema.orgId, org.id),
        eq(mpNotificationSchema.mpNotificationId, notificationId),
      ),
    );

  if (existing) {
    return NextResponse.json({ received: true });
  }

  // Para pagos, enriquecemos con los datos del pago via MP API
  let amount: string | null = null;
  let description: string | null = null;
  let status: string | null = null;
  let payerEmail: string | null = null;
  let payerName: string | null = null;
  let paymentMethodId: string | null = null;
  let paymentTypeId: string | null = null;
  let externalReference: string | null = null;
  let rawPayload: string | null = null;

  if ((topic === 'payment' || action?.startsWith('payment')) && resourceId) {
    try {
      const paymentRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${resourceId}`,
        { headers: { Authorization: `Bearer ${org.mpOauthAccessToken}` } },
      );

      if (paymentRes.ok) {
        const payment = await paymentRes.json();
        amount = String(payment.transaction_amount ?? '');
        description = payment.description ?? null;
        status = payment.status ?? null;
        payerEmail = payment.payer?.email ?? null;
        payerName = payment.payer?.first_name
          ? `${payment.payer.first_name} ${payment.payer.last_name ?? ''}`.trim()
          : null;
        paymentMethodId = payment.payment_method_id ?? null;
        paymentTypeId = payment.payment_type_id ?? null;
        externalReference = payment.external_reference ?? null;
        rawPayload = JSON.stringify(payment);
      }
    } catch (err) {
      console.error('[MP Webhook] Error fetching payment:', err);
    }
  }

  // Guardar la notificación
  await db.insert(mpNotificationSchema).values({
    orgId: org.id,
    mpNotificationId: notificationId,
    topic,
    action,
    resourceId,
    status,
    amount: amount ?? undefined,
    description,
    payerEmail,
    payerName,
    paymentMethodId,
    paymentTypeId,
    externalReference,
    rawPayload,
  });

  // MP espera un 200 rápido, si no reintenta
  return NextResponse.json({ received: true });
}
