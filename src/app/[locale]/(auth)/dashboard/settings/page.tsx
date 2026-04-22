import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { FileText, Lock } from 'lucide-react';
import { Suspense } from 'react';

import { ArcaWizard } from '@/features/arca/ArcaWizard';
import { BillingPage } from '@/features/billing/BillingPage';
import { BrandingPage } from '@/features/branding/BrandingPage';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { LocationList } from '@/features/locations/LocationList';
import { MemberList } from '@/features/members/MemberList';
import { SettingsTabNav } from '@/features/settings/SettingsTabNav';
import { db } from '@/libs/DB';
import { getOrgAccess } from '@/libs/OrgAccess';
import { organizationSchema } from '@/models/Schema';

const TABS = [
  { id: 'locations', label: 'Locales' },
  { id: 'members', label: 'Miembros' },
  { id: 'plans', label: 'Planes' },
  { id: 'arca', label: 'Facturación ARCA' },
  { id: 'branding', label: 'Personalización' },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = rawTab ?? 'locations';

  const { orgId, orgRole } = await auth();
  const isAdmin = orgRole === 'org:admin';

  let content: React.ReactNode = null;

  if (tab === 'locations') {
    content = (
      <div className="rounded-md bg-card p-6 shadow-sm">
        <LocationList isAdmin={isAdmin} />
      </div>
    );
  } else if (tab === 'members') {
    content = (
      <div className="rounded-md bg-card p-6 shadow-sm">
        {isAdmin
          ? (
              <MemberList isAdmin={isAdmin} />
            )
          : (
              <p className="text-sm text-muted-foreground">
                Solo los administradores pueden gestionar los miembros de la organización.
              </p>
            )}
      </div>
    );
  } else if (tab === 'plans') {
    content = <BillingPage />;
  } else if (tab === 'arca') {
    if (!isAdmin) {
      content = (
        <p className="text-sm text-muted-foreground">
          Solo los administradores pueden acceder a esta sección.
        </p>
      );
    } else {
      const hasAccess = orgId
        ? await getOrgAccess(orgId).then(a => a.isProOrBetter || a.hasModule('arca'))
        : false;

      content = hasAccess
        ? <ArcaWizard />
        : (
            <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/40 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <Lock className="size-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Funcionalidad del plan Pro y Empresa</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  La emisión de facturas electrónicas mediante ARCA (ex-AFIP) está disponible
                  a partir del plan Pro. Actualizá tu plan para habilitarla.
                </p>
              </div>
              <a
                href="/dashboard/settings?tab=plans"
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <FileText className="size-4" />
                Ver planes
              </a>
            </div>
          );
    }
  } else if (tab === 'branding') {
    if (!isAdmin) {
      content = (
        <p className="text-sm text-muted-foreground">
          Solo los administradores pueden acceder a esta sección.
        </p>
      );
    } else {
      let isPaidPlan = false;
      if (orgId) {
        const [org] = await db
          .select({ planType: organizationSchema.planType })
          .from(organizationSchema)
          .where(eq(organizationSchema.id, orgId));
        isPaidPlan = !!org && org.planType !== 'free';
      }
      content = <BrandingPage isPaidPlan={isPaidPlan} />;
    }
  }

  return (
    <>
      <TitleBar
        title="Configuración"
        description="Gestioná los locales, miembros y opciones de tu organización"
      />
      <Suspense>
        <SettingsTabNav tabs={TABS} />
      </Suspense>
      <div className="mt-6">{content}</div>
    </>
  );
}
