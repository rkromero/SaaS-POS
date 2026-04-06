import { TitleBar } from '@/features/dashboard/TitleBar';
import { SalesList } from '@/features/sales/SalesList';

export default function SalesPage() {
  return (
    <>
      <TitleBar
        title="Ventas"
        description="Historial de todas las ventas registradas"
      />
      <div className="rounded-md bg-card p-6 shadow-sm">
        <SalesList />
      </div>
    </>
  );
}
