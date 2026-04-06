import { auth } from '@clerk/nextjs/server';

import { TitleBar } from '@/features/dashboard/TitleBar';
import { StockAlerts } from '@/features/stock/StockAlerts';
import { StockList } from '@/features/stock/StockList';

export default async function StockPage() {
  const { orgRole } = await auth();
  const isAdmin = orgRole === 'org:admin';

  return (
    <>
      <TitleBar
        title="Stock"
        description="Controlá el inventario de cada local"
      />
      <div className="space-y-6">
        <div className="rounded-md bg-card p-6 shadow-sm">
          <h2 className="mb-3 font-semibold">Alertas de stock</h2>
          <StockAlerts />
        </div>
        <div className="rounded-md bg-card p-6 shadow-sm">
          <StockList isAdmin={isAdmin} />
        </div>
      </div>
    </>
  );
}
