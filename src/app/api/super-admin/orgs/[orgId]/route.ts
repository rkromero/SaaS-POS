import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { isSuperAdmin } from '@/libs/SuperAdmin';
import { organizationSchema, orgModuleSchema } from '@/models/Schema';

// GET /api/super-admin/orgs/[orgId] — detalle completo de un cliente
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { orgId } = await params;
  const client = await clerkClient();

  const [clerkOrg, dbOrgs, moduleRows] = await Promise.all([
    client.organizations.getOrganization({ organizationId: orgId }),
    db.select().from(organizationSchema).where(eq(organizationSchema.id, orgId)),
    db.select().from(orgModuleSchema).where(eq(orgModuleSchema.orgId, orgId)),
  ]);

  const dbOrg = dbOrgs[0] ?? null;

  return NextResponse.json({
    id: clerkOrg.id,
    name: clerkOrg.name,
    imageUrl: clerkOrg.imageUrl,
    membersCount: clerkOrg.membersCount,
    createdAt: clerkOrg.createdAt,
    planType: dbOrg?.planType ?? 'free',
    licenseType: dbOrg?.licenseType ?? 'none',
    mpPlanStatus: dbOrg?.mpPlanStatus ?? null,
    mpPreapprovalId: dbOrg?.mpPreapprovalId ?? null,
    planExpiresAt: dbOrg?.planExpiresAt ?? null,
    enabledModules: moduleRows.map(m => m.moduleName),
  });
}
