// OrgAccess — fuente única de verdad para control de acceso por organización.
//
// Prioridad:
//   1. Módulo activo manualmente → siempre habilitado
//   2. Licencia becada → acceso completo tipo Enterprise (ilimitado)
//   3. Plan activo → límites según el plan
//   4. Plan expirado → límites del plan Free
//
// Uso en API routes:
//   const access = await getOrgAccess(orgId);
//   if (!access.isProOrBetter) return NextResponse.json({ error: 'Plan requerido' }, { status: 403 });
//   if (!access.hasModule('branding')) return NextResponse.json({ error: 'Módulo no disponible' }, { status: 403 });
//   if (!access.canAddLocation(currentCount)) return NextResponse.json({ error: access.locationLimitMessage }, { status: 403 });

import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import type { PlanType } from '@/libs/Plans';
import { canAddLocation, canRegisterSale, getPlan } from '@/libs/Plans';
import { organizationSchema, orgModuleSchema } from '@/models/Schema';

export type OrgAccess = {
  planType: PlanType;
  licenseType: 'none' | 'becada';
  planExpired: boolean;
  isBecada: boolean;
  isPaidPlan: boolean; // basic, socio, pro, enterprise — activo
  isProOrBetter: boolean; // pro/enterprise activo OR becada
  modules: string[];
  hasModule: (name: string) => boolean;

  // ── Límites efectivos (respetan expiración y licencia becada) ────────────
  /** Plan que se usa para calcular límites: enterprise si becada, free si expirado, original si activo */
  effectivePlanType: PlanType;
  /** Máximo de locales permitidos (-1 = ilimitado) */
  maxLocations: number;
  /** Máximo de ventas mensuales permitidas (-1 = ilimitado) */
  maxMonthlySales: number;
  /** Devuelve true si la org puede crear un local más */
  canAddLocation: (currentCount: number) => boolean;
  /** Devuelve true si la org puede registrar una venta más este mes */
  canRegisterSale: (monthlyCount: number) => boolean;
  /** Mensaje de error listo para devolver cuando se supera el límite de locales */
  locationLimitMessage: string;
  /** Mensaje de error listo para devolver cuando se supera el límite mensual de ventas */
  saleLimitMessage: string;
};

export async function getOrgAccess(orgId: string): Promise<OrgAccess> {
  // Fetch org record + módulos en paralelo
  const [orgRows, moduleRows] = await Promise.all([
    db.select().from(organizationSchema).where(eq(organizationSchema.id, orgId)),
    db.select({ moduleName: orgModuleSchema.moduleName }).from(orgModuleSchema).where(eq(orgModuleSchema.orgId, orgId)),
  ]);

  const org = orgRows[0];
  const modules = moduleRows.map(r => r.moduleName);

  const planType = (org?.planType ?? 'free') as PlanType;
  const licenseType = (org?.licenseType ?? 'none') as 'none' | 'becada';

  const now = new Date();
  // planExpiresAt null = no expira (asignación manual), fecha pasada = expirado
  const planExpired = org?.planExpiresAt != null && org.planExpiresAt < now;

  const isBecada = licenseType === 'becada';
  const isPaidPlan = planType !== 'free' && !planExpired;
  const isProOrBetter = isBecada || ((planType === 'pro' || planType === 'enterprise') && !planExpired);

  // Plan efectivo para límites:
  //   - becada → enterprise (ilimitado)
  //   - plan expirado → free (mínimo)
  //   - activo → plan real
  const effectivePlanType: PlanType = isBecada ? 'enterprise' : planExpired ? 'free' : planType;
  const effectivePlan = getPlan(effectivePlanType);

  const hasModule = (name: string) => modules.includes(name);

  // Mensajes de error para las APIs
  const planName = getPlan(planType).name;
  const locationLimitMessage
    = effectivePlan.maxLocations === 1
      ? `Tu plan ${planName} permite solo 1 local. Actualizá tu plan para agregar más sucursales.`
      : `Tu plan ${planName} permite hasta ${effectivePlan.maxLocations} locales. Actualizá tu plan para agregar más.`;

  const saleLimitMessage
    = `Tu plan ${planName} permite hasta ${effectivePlan.maxMonthlySales} ventas por mes. Actualizá tu plan para continuar vendiendo este mes.`;

  return {
    planType,
    licenseType,
    planExpired,
    isBecada,
    isPaidPlan,
    isProOrBetter,
    modules,
    hasModule,
    effectivePlanType,
    maxLocations: effectivePlan.maxLocations,
    maxMonthlySales: effectivePlan.maxMonthlySales,
    canAddLocation: (currentCount: number) => canAddLocation(effectivePlanType, currentCount),
    canRegisterSale: (monthlyCount: number) => canRegisterSale(effectivePlanType, monthlyCount),
    locationLimitMessage,
    saleLimitMessage,
  };
}
