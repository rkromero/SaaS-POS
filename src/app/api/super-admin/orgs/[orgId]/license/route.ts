import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { isSuperAdmin } from '@/libs/SuperAdmin';
import { organizationSchema } from '@/models/Schema';

// PUT /api/super-admin/orgs/[orgId]/license — asignar o quitar licencia becada
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { orgId } = await params;
  const { licenseType } = await request.json() as { licenseType: 'none' | 'becada' };

  if (licenseType !== 'none' && licenseType !== 'becada') {
    return NextResponse.json({ error: 'licenseType debe ser "none" o "becada"' }, { status: 400 });
  }

  // Upsert org record
  const existing = await db
    .select({ id: organizationSchema.id })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId));

  if (existing.length === 0) {
    await db.insert(organizationSchema).values({ id: orgId, planType: 'free', licenseType });
  } else {
    await db
      .update(organizationSchema)
      .set({ licenseType })
      .where(eq(organizationSchema.id, orgId));
  }

  return NextResponse.json({ success: true, licenseType });
}
