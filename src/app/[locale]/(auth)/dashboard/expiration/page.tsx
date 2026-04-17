import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { TitleBar } from '@/features/dashboard/TitleBar';
import { ExpirationPage } from '@/features/stock/ExpirationPage';
import { getOrgAccess } from '@/libs/OrgAccess';

export default async function ExpirationDashboardPage() {
  const { orgId } = await auth();

  if (!orgId) {
    redirect('/dashboard');
  }

  const access = await getOrgAccess(orgId);
  if (!access.hasModule('stock_expiration')) {
    redirect('/dashboard');
  }

  return (
    <>
      <TitleBar
        title="Control de Vencimientos"
        description="Lotes próximos a vencer, productos vencidos y configuración de alertas"
      />
      <ExpirationPage />
    </>
  );
}
