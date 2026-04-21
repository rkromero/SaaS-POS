import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import type { PlanType } from '@/libs/Plans';
import { organizationSchema } from '@/models/Schema';

// POST /api/billing/webhook — handle Mercado Pago subscription events
// Configure this URL in MP dashboard: https://your-domain.com/api/billing/webhook
export async function POST(request: Request) {
  const body = await request.json();

  const { type, data } = body;

  if (type !== 'subscription_preapproval') {
    return NextResponse.json({ received: true });
  }

  const mpToken = Env.MP_ACCESS_TOKEN;
  if (!mpToken) {
    return NextResponse.json({ error: 'MP token not configured' }, { status: 500 });
  }

  // Fetch full subscription data from MP
  const response = await fetch(`https://api.mercadopago.com/preapproval/${data.id}`, {
    headers: { Authorization: `Bearer ${mpToken}` },
  });

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

  // Stale webhook protection: when a user changes plans we cancel the old preapproval
  // and immediately save the new preapproval ID. If MP sends a 'cancelled' webhook for
  // the OLD preapproval after we've already switched, we ignore it to avoid downgrading
  // a subscription that is actually active.
  if (status === 'cancelled') {
    const [org] = await db
      .select({ mpPreapprovalId: organizationSchema.mpPreapprovalId })
      .from(organizationSchema)
      .where(eq(organizationSchema.id, orgId));

    if (org?.mpPreapprovalId && org.mpPreapprovalId !== preapprovalId) {
      return NextResponse.json({ received: true, ignored: 'stale_cancellation' });
    }
  }

  const isActive = status === 'authorized';

  // Each successful renewal resets the 30-day window from today.
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
