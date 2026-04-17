import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { MODULE_PLAN_REQUIREMENTS } from '@/libs/Modules';
import { getOrgAccess } from '@/libs/OrgAccess';
import { isSuperAdmin } from '@/libs/SuperAdmin';
import { organizationSchema, orgModuleSchema } from '@/models/Schema';

// GET /api/super-admin/orgs/[orgId]/modules — módulos activos del cliente
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { orgId } = await params;
  const rows = await db
    .select()
    .from(orgModuleSchema)
    .where(eq(orgModuleSchema.orgId, orgId));

  return NextResponse.json(rows.map(r => r.moduleName));
}

// POST /api/super-admin/orgs/[orgId]/modules — activar un módulo
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { orgId } = await params;
  const { moduleName } = await request.json() as { moduleName: string };

  if (!moduleName) {
    return NextResponse.json({ error: 'moduleName es requerido' }, { status: 400 });
  }

  // Verificar restricción de plan para módulos que lo requieren
  const requiredPlans = MODULE_PLAN_REQUIREMENTS[moduleName as keyof typeof MODULE_PLAN_REQUIREMENTS];
  if (requiredPlans) {
    const access = await getOrgAccess(orgId);
    if (!requiredPlans.includes(access.effectivePlanType)) {
      return NextResponse.json(
        {
          error: `El módulo '${moduleName}' requiere plan ${requiredPlans.join(' o ')}. La org tiene plan '${access.effectivePlanType}'.`,
        },
        { status: 403 },
      );
    }
  }

  try {
    // Garantizar que la org existe en nuestra DB (puede no estar si nunca pasó por onboarding).
    await db
      .insert(organizationSchema)
      .values({ id: orgId, planType: 'free' })
      .onConflictDoNothing();

    // INSERT OR IGNORE (unique constraint handles duplicates)
    await db
      .insert(orgModuleSchema)
      .values({ orgId, moduleName, enabledByUserId: userId })
      .onConflictDoNothing();

    return NextResponse.json({ success: true, moduleName });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
