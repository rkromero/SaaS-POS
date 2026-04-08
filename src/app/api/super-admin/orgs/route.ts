import { auth, clerkClient } from '@clerk/nextjs/server';
import { count } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { isSuperAdmin } from '@/libs/SuperAdmin';
import { organizationSchema, orgModuleSchema } from '@/models/Schema';

// GET /api/super-admin/orgs — lista todos los clientes con su plan, licencia y módulos
export async function GET() {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = await clerkClient();

  // Fetch all Clerk organizations (paginado hasta 500)
  const { data: clerkOrgs } = await client.organizations.getOrganizationList({ limit: 500 });

  // Fetch DB records — solo los campos necesarios para evitar errores si hay columnas pendientes de migrar
  const dbOrgs = await db.select({
    id: organizationSchema.id,
    planType: organizationSchema.planType,
    licenseType: organizationSchema.licenseType,
    mpPlanStatus: organizationSchema.mpPlanStatus,
    planExpiresAt: organizationSchema.planExpiresAt,
  }).from(organizationSchema);

  // Count modules per org
  const moduleCounts = await db
    .select({ orgId: orgModuleSchema.orgId, total: count() })
    .from(orgModuleSchema)
    .groupBy(orgModuleSchema.orgId);

  const dbMap = new Map(dbOrgs.map(o => [o.id, o]));
  const moduleMap = new Map(moduleCounts.map(m => [m.orgId, Number(m.total)]));

  const orgs = clerkOrgs.map((co) => {
    const db = dbMap.get(co.id);
    return {
      id: co.id,
      name: co.name,
      membersCount: co.membersCount,
      createdAt: co.createdAt,
      imageUrl: co.imageUrl,
      planType: db?.planType ?? 'free',
      licenseType: db?.licenseType ?? 'none',
      mpPlanStatus: db?.mpPlanStatus ?? null,
      planExpiresAt: db?.planExpiresAt ?? null,
      moduleCount: moduleMap.get(co.id) ?? 0,
    };
  });

  // Ordenar: becada primero, luego por fecha de creación desc
  orgs.sort((a, b) => {
    if (a.licenseType === 'becada' && b.licenseType !== 'becada') {
      return -1;
    }
    if (b.licenseType === 'becada' && a.licenseType !== 'becada') {
      return 1;
    }
    return b.createdAt - a.createdAt;
  });

  return NextResponse.json(orgs);
}
