import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { TitleBar } from '@/features/dashboard/TitleBar';
import { LoyaltyRewardsPage } from '@/features/loyalty/LoyaltyRewardsPage';

export default async function LoyaltyRewardsRoute() {
  const { orgRole } = await auth();

  if (orgRole !== 'org:admin') {
    redirect('/dashboard');
  }

  return (
    <>
      <TitleBar
        title="Catálogo de premios"
        description="Configurá los productos y descuentos que los clientes pueden canjear con sus puntos"
      />
      <LoyaltyRewardsPage />
    </>
  );
}
