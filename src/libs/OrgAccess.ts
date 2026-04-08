// OrgAccess — fuente única de verdad para control de acceso por organización.
//
// Prioridad:
//   1. Módulo activo manualmente → siempre habilitado
//   2. Licencia becada → acceso completo tipo PRO
//   3. Plan PRO/Enterprise activo → acceso normal
//   4. Otros → acceso limitado
//
// Uso en API routes:
//   const access = await getOrgAccess(orgId);
//   if (!access.isProOrBetter) return NextResponse.json({ error: 'Plan requerido' }, { status: 403 });
//   if (!access.hasModule('branding')) return NextResponse.json({ error: 'Módulo no disponible' }, { status: 403 });

import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import type { PlanType } from '@/libs/Plans';
import { organizationSchema, orgModuleSchema } from '@/models/Schema';

export type OrgAccess = {
  planType: PlanType;
  licenseType: 'none' | 'becada';
  planExpired: boolean;
  isBecada: boolean;
  isPaidPlan: boolean; // basic, socio, pro, enterprise — activo
  isProOrBetter: boolean; // pro/enterprise activo OR becada
  modules: string[]; // módulos activados manualmente
  hasModule: (name: string) => boolean;
};

export async function getOrgAccess(orgId: string): Promise<OrgAccess> {
  // Fetch org record
  const [org] = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId));

  // Fetch manually enabled modules
  const moduleRows = await db
    .select({ moduleName: orgModuleSchema.moduleName })
    .from(orgModuleSchema)
    .where(eq(orgModuleSchema.orgId, orgId));

  const modules = moduleRows.map(r => r.moduleName);

  const planType = (org?.planType ?? 'free') as PlanType;
  const licenseType = (org?.licenseType ?? 'none') as 'none' | 'becada';

  const now = new Date();
  // planExpiresAt null = no expira (manual assign), futuro = activo
  const planExpired = org?.planExpiresAt != null && org.planExpiresAt < now;

  const isBecada = licenseType === 'becada';
  const isPaidPlan = planType !== 'free' && !planExpired;
  const isProOrBetter = isBecada || ((planType === 'pro' || planType === 'enterprise') && !planExpired);

  const hasModule = (name: string) => modules.includes(name);

  return {
    planType,
    licenseType,
    planExpired,
    isBecada,
    isPaidPlan,
    isProOrBetter,
    modules,
    hasModule,
  };
}
