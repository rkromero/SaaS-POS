import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

import { BrandingProvider } from '@/features/branding/BrandingContext';
import { DashboardSidebar } from '@/features/dashboard/DashboardSidebar';
import { OnboardingProvider } from '@/features/onboarding/OnboardingContext';
import { OnboardingTour } from '@/features/onboarding/OnboardingTour';
import { db } from '@/libs/DB';
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
  if (orgId) {
    const [result] = await db
      .select()
      .from(brandingSchema)
      .where(eq(brandingSchema.organizationId, orgId));
    branding = result ?? null;
  }

  return (
    <BrandingProvider branding={branding}>
      <OnboardingProvider>
        <div className="min-h-screen bg-muted">
          <DashboardSidebar />
          <main className="lg:pl-56">
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
