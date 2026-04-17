import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

import { BrandingProvider } from '@/features/branding/BrandingContext';
import { DashboardSidebar } from '@/features/dashboard/DashboardSidebar';
import { OnboardingProvider } from '@/features/onboarding/OnboardingContext';
import { OnboardingTour } from '@/features/onboarding/OnboardingTour';
import { db } from '@/libs/DB';
import { getOrgAccess } from '@/libs/OrgAccess';
import { brandingSchema } from '@/models/Schema';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function DashboardLayout(props: { children: React.ReactNode }) {
  const { orgId } = await auth();

  let branding = null;
  let enabledModules: string[] = [];
  if (orgId) {
    const [brandingResult, access] = await Promise.all([
      db.select().from(brandingSchema).where(eq(brandingSchema.organizationId, orgId)),
      getOrgAccess(orgId),
    ]);
    branding = brandingResult[0] ?? null;

    // Módulos activados manualmente + módulos incluidos por plan
    // Arca y Promociones están disponibles en Pro y Empresa sin activación manual.
    // stock_expiration requiere activación manual por Super Admin (solo pro/enterprise).
    enabledModules = [...access.modules];
    if (access.isProOrBetter) {
      if (!enabledModules.includes('arca')) {
        enabledModules.push('arca');
      }
      if (!enabledModules.includes('promotions')) {
        enabledModules.push('promotions');
      }
    }

    // DEBUG — quitar después de resolver
    // eslint-disable-next-line no-console
    console.log('[layout] orgId:', orgId, '| plan:', access.planType, '| modules:', access.modules, '| enabledModules:', enabledModules);
  }

  return (
    <BrandingProvider branding={branding}>
      <OnboardingProvider>
        <div className="min-h-screen bg-muted">
          <DashboardSidebar enabledModules={enabledModules} />
          <main className="sidebar-main">
            <div className="px-4 pb-16 pt-6 sm:px-6">
              {props.children}
            </div>
          </main>
        </div>
        {/* Onboarding tour — mounts once, manages its own visibility */}
        <OnboardingTour />
      </OnboardingProvider>
    </BrandingProvider>
  );
}

export const dynamic = 'force-dynamic';
