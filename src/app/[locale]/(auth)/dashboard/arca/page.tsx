import { auth } from '@clerk/nextjs/server';
import { FileText, Lock } from 'lucide-react';

import { ArcaWizard } from '@/features/arca/ArcaWizard';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { getOrgAccess } from '@/libs/OrgAccess';

export default async function ArcaPage() {
  const { orgId, orgRole } = await auth();

  if (orgRole !== 'org:admin') {
    return (
      <p className="text-sm text-muted-foreground">
        Solo los administradores pueden acceder a esta sección.
      </p>
    );
  }

  // Verificar acceso: plan Pro/Empresa o módulo activado manualmente
  const hasAccess = orgId
    ? await getOrgAccess(orgId).then(a => a.isProOrBetter || a.hasModule('arca'))
    : false;

  if (!hasAccess) {
    return (
      <>
        <TitleBar
          title="Facturación ARCA"
          description="Configurá la emisión de facturas electrónicas (ex-AFIP)"
        />
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
            href="/dashboard/billing"
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <FileText className="size-4" />
            Ver planes
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBar
        title="Facturación ARCA"
        description="Configurá la emisión de facturas electrónicas (ex-AFIP)"
      />
      <ArcaWizard />
    </>
  );
}
