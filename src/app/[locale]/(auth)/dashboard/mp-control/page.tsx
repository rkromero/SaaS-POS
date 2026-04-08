import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { MpControlDashboard } from '@/features/mp-control/MpControlDashboard';
import { getOrgAccess } from '@/libs/OrgAccess';

export const metadata = { title: 'Control Mercado Pago' };
export const dynamic = 'force-dynamic';

export default async function MpControlPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    redirect('/sign-in');
  }

  const access = await getOrgAccess(orgId);
  if (!access.hasModule('mp_control')) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Control Mercado Pago</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conectá tu cuenta de MP y recibí notificaciones de cobros, depósitos y transferencias en tiempo real.
        </p>
      </div>
      <MpControlDashboard />
    </div>
  );
}
