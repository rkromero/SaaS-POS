import { auth } from '@clerk/nextjs/server';

import { CajaPage } from '@/features/caja/CajaPage';
import { TitleBar } from '@/features/dashboard/TitleBar';

export default async function CajaRoute() {
  const { orgRole } = await auth();
  const isAdmin = orgRole === 'org:admin';

  return (
    <>
      <TitleBar
        title="Caja"
        description="Apertura y cierre de caja diaria"
      />
      <CajaPage isAdmin={isAdmin} />
    </>
  );
}
