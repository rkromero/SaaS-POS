import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import type { PlanType } from '@/libs/Plans';
import { isSuperAdmin } from '@/libs/SuperAdmin';
import { organizationSchema } from '@/models/Schema';

// POST /api/billing/admin/assign — manually assign a plan to an org (super admin only)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSuperAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { targetOrgId, planId } = await request.json();

  if (!targetOrgId || !planId) {
    return NextResponse.json({ error: 'targetOrgId y planId son requeridos' }, { status: 400 });
  }

  // Get or create org record
  const existing = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, targetOrgId));

  if (existing.length === 0) {
    await db
      .insert(organizationSchema)
      .values({ id: targetOrgId, planType: planId as PlanType });
  } else {
    await db
      .update(organizationSchema)
      .set({
        planType: planId as PlanType,
        mpPlanStatus: 'authorized',
        planExpiresAt: null, // manual plans don't expire
      })
      .where(eq(organizationSchema.id, targetOrgId));
  }

  return NextResponse.json({ success: true });
}
