import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { getPlan } from '@/libs/Plans';
import { organizationSchema } from '@/models/Schema';

// GET /api/billing/status — current plan for the org
export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get or create org record
  let [org] = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId));

  if (!org) {
    [org] = await db
      .insert(organizationSchema)
      .values({ id: orgId, planType: 'free' })
      .returning();
  }

  const plan = getPlan(org!.planType);

  return NextResponse.json({
    planType: org!.planType,
    plan,
    mpPreapprovalId: org!.mpPreapprovalId,
    mpPlanStatus: org!.mpPlanStatus,
    planExpiresAt: org!.planExpiresAt,
  });
}
