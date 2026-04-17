import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { TitleBar } from '@/features/dashboard/TitleBar';
import { LoyaltyConfigPage } from '@/features/loyalty/LoyaltyConfigPage';

export default async function LoyaltyPage() {
  const { orgRole } = await auth();

  // Solo admins pueden gestionar la configuración de fidelización
  if (orgRole !== 'org:admin') {
    redirect('/dashboard');
  }

  return (
    <>
      <TitleBar
        title="Fidelización"
        description="Configuración del programa de puntos y canjes para clientes"
      />
      <LoyaltyConfigPage />
    </>
  );
}
