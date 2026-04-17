import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { TitleBar } from '@/features/dashboard/TitleBar';
import { LoyaltyReportsPage } from '@/features/loyalty/LoyaltyReportsPage';

export default async function LoyaltyReportsRoute() {
  const { orgRole } = await auth();

  if (orgRole !== 'org:admin') {
    redirect('/dashboard');
  }

  return (
    <>
      <TitleBar
        title="Reportes de fidelización"
        description="Puntos emitidos, canjeados y clientes más activos"
      />
      <LoyaltyReportsPage />
    </>
  );
}
