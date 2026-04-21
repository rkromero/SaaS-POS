// Cron job: verifica suscripciones vencidas diariamente y baja el plan a free.
// Protegido con CRON_SECRET. Configurado en vercel.json.
//
// Caso que maneja: MP cobró pero el webhook nunca llegó, o MP no pudo cobrar
// y la suscripción expiró. Si planExpiresAt es pasado y el status aún dice
// 'authorized', bajamos el plan — MP ya debería haber enviado renovación.

import { and, eq, isNotNull, lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { organizationSchema } from '@/models/Schema';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const expectedSecret = Env.CRON_SECRET;
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();

  // Find orgs where the subscription was active but planExpiresAt has passed.
  // A grace period of 3 days is applied to avoid downgrading due to webhook delays.
  const gracePeriodMs = 3 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(now.getTime() - gracePeriodMs);

  const expired = await db
    .select({ id: organizationSchema.id, planType: organizationSchema.planType })
    .from(organizationSchema)
    .where(
      and(
        eq(organizationSchema.mpPlanStatus, 'authorized'),
        isNotNull(organizationSchema.planExpiresAt),
        lt(organizationSchema.planExpiresAt, cutoff),
      ),
    );

  if (expired.length === 0) {
    return NextResponse.json({ checked: 0, downgraded: 0 });
  }

  let downgraded = 0;
  for (const org of expired) {
    await db
      .update(organizationSchema)
      .set({
        planType: 'free',
        // Use 'paused' to differentiate from user-initiated cancellation.
        // This means: subscription lapsed, not explicitly cancelled.
        mpPlanStatus: 'paused',
        planExpiresAt: null,
      })
      .where(eq(organizationSchema.id, org.id));
    downgraded++;
  }

  return NextResponse.json({ checked: expired.length, downgraded });
}
