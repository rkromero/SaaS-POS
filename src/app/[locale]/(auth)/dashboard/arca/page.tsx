import { auth } from '@clerk/nextjs/server';

import { ArcaWizard } from '@/features/arca/ArcaWizard';
import { TitleBar } from '@/features/dashboard/TitleBar';

export default async function ArcaPage() {
  const { orgRole } = await auth();

  if (orgRole !== 'org:admin') {
    return (
      <p className="text-sm text-muted-foreground">
        Solo los administradores pueden acceder a esta sección.
      </p>
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
