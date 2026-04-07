import { auth } from '@clerk/nextjs/server';

import { TitleBar } from '@/features/dashboard/TitleBar';
import { FiadoPage } from '@/features/fiado/FiadoPage';

export default async function FiadoRoute() {
  const { orgRole } = await auth();
  const isAdmin = orgRole === 'org:admin';

  return (
    <>
      <TitleBar
        title="Fiado"
        description="Cuenta corriente de clientes"
      />
      <FiadoPage isAdmin={isAdmin} />
    </>
  );
}
