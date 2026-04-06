import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import type { PlanType } from '@/libs/Plans';
import { organizationSchema } from '@/models/Schema';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

// POST /api/billing/webhook — handle Mercado Pago subscription events
// Configure this URL in MP dashboard: https://your-domain.com/api/billing/webhook
export async function POST(request: Request) {
  const body = await request.json();

  // MP sends different event types
  const { type, data } = body;

  if (type !== 'subscription_preapproval') {
    return NextResponse.json({ received: true });
  }

  // Fetch full subscription data from MP
  const response = await fetch(
    `https://api.mercadopago.com/preapproval/${data.id}`,
    {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    },
  );

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }

  const subscription = await response.json();
  const { external_reference, status, id: preapprovalId } = subscription;

  // external_reference format: "orgId|planId"
  const [orgId, planId] = external_reference?.split('|') ?? [];
  if (!orgId || !planId) {
    return NextResponse.json({ error: 'Invalid external_reference' }, { status: 400 });
  }

  // Map MP status to plan status and activate/deactivate accordingly
  // authorized = active subscription
  // paused = subscription paused
  // cancelled = subscription cancelled
  const isActive = status === 'authorized';

  // Calculate next period end (30 days from now if active)
  const planExpiresAt = isActive
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : null;

  await db
    .update(organizationSchema)
    .set({
      planType: isActive ? (planId as PlanType) : 'free',
      mpPreapprovalId: preapprovalId,
      mpPlanStatus: status,
      planExpiresAt,
    })
    .where(eq(organizationSchema.id, orgId));

  return NextResponse.json({ received: true });
}
