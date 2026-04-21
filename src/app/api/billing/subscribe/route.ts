import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { getPlan, type PlanType } from '@/libs/Plans';
import { organizationSchema } from '@/models/Schema';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// MP subscription duration in months
const PLAN_FREQUENCY: Record<string, { frequency: number; frequency_type: string }> = {
  basic: { frequency: 1, frequency_type: 'months' },
  pro: { frequency: 1, frequency_type: 'months' },
  enterprise: { frequency: 1, frequency_type: 'months' },
};

// USD prices — converted to ARS at fixed rate for now
// In production you'd fetch the live exchange rate
const USD_TO_ARS = 1200;

// POST /api/billing/subscribe — create MP subscription link
// If the org already has an active preapproval (plan change), cancel it first.
// The 30-day cycle always resets from the day the new subscription is authorized.
export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mpToken = Env.MP_ACCESS_TOKEN;
  if (!mpToken) {
    return NextResponse.json({ error: 'Configuración de pago no disponible' }, { status: 500 });
  }

  const { planId } = await request.json();
  const plan = getPlan(planId as PlanType);

  if (plan.manualAssign || plan.priceUSD === 0) {
    return NextResponse.json({ error: 'Este plan no es de pago' }, { status: 400 });
  }

  // Check if org already has a preapproval that needs to be cancelled first
  const [currentOrg] = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId));

  if (currentOrg?.mpPreapprovalId && currentOrg.mpPlanStatus !== 'cancelled') {
    // Cancel old preapproval — we don't fail the request if this errors,
    // since the old subscription may already be expired or in an unknown state.
    await fetch(`https://api.mercadopago.com/preapproval/${currentOrg.mpPreapprovalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpToken}`,
      },
      body: JSON.stringify({ status: 'cancelled' }),
    }).catch(() => null);
  }

  // Get org name from Clerk
  const client = await clerkClient();
  const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId });

  const priceARS = plan.priceUSD * USD_TO_ARS;
  const frequency = PLAN_FREQUENCY[planId]!;

  // Create new MP preapproval (recurring subscription).
  // We intentionally omit payer_email so the user can log into any MP account
  // at checkout — sending a mismatched email causes 3DS challenge failures in sandbox.
  const response = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mpToken}`,
    },
    body: JSON.stringify({
      reason: `${plan.name} — ${clerkOrg.name}`,
      auto_recurring: {
        frequency: frequency.frequency,
        frequency_type: frequency.frequency_type,
        transaction_amount: priceARS,
        currency_id: 'ARS',
      },
      back_url: `${APP_URL}/dashboard/billing?status=success`,
      external_reference: `${orgId}|${planId}`,
      status: 'pending',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json(
      { error: 'Error al crear suscripción en Mercado Pago', details: error },
      { status: 500 },
    );
  }

  const data = await response.json();

  // Save new preapproval ID — this also prevents the old cancellation webhook
  // from downgrading the plan (webhook handler checks ID match).
  await db
    .update(organizationSchema)
    .set({
      mpPreapprovalId: data.id,
      mpPlanStatus: 'pending',
    })
    .where(eq(organizationSchema.id, orgId));

  return NextResponse.json({ checkoutUrl: data.init_point });
}
