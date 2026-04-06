import { TitleBar } from '@/features/dashboard/TitleBar';
import { PurchaseOrderManager } from '@/features/suppliers/PurchaseOrderManager';
import { SupplierManager } from '@/features/suppliers/SupplierManager';

export default function SuppliersRoute() {
  return (
    <>
      <TitleBar
        title="Proveedores"
        description="Gestioná tus proveedores y pedidos de reposición"
      />
      <div className="space-y-8">
        <div className="rounded-md bg-card p-6 shadow-sm">
          <SupplierManager />
        </div>
        <div className="rounded-md bg-card p-6 shadow-sm">
          <PurchaseOrderManager />
        </div>
      </div>
    </>
  );
}
