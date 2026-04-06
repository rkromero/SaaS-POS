import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { getPlan, type PlanType } from '@/libs/Plans';
import { organizationSchema } from '@/models/Schema';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;
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
export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { planId } = await request.json();
  const plan = getPlan(planId as PlanType);

  if (plan.manualAssign || plan.priceUSD === 0) {
    return NextResponse.json({ error: 'Este plan no es de pago' }, { status: 400 });
  }

  // Get user info from Clerk for payer data
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress ?? '';

  // Get org name
  const org = await client.organizations.getOrganization({ organizationId: orgId });

  const priceARS = plan.priceUSD * USD_TO_ARS;
  const frequency = PLAN_FREQUENCY[planId]!;

  // Create MP preapproval (recurring subscription)
  const response = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      reason: `${plan.name} — ${org.name}`,
      auto_recurring: {
        frequency: frequency.frequency,
        frequency_type: frequency.frequency_type,
        transaction_amount: priceARS,
        currency_id: 'ARS',
      },
      payer_email: email,
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

  // Save preapproval ID to org
  await db
    .update(organizationSchema)
    .set({
      mpPreapprovalId: data.id,
      mpPlanStatus: 'pending',
    })
    .where(eq(organizationSchema.id, orgId));

  return NextResponse.json({ checkoutUrl: data.init_point });
}
