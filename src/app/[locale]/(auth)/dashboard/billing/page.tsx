import { BillingPage } from '@/features/billing/BillingPage';
import { TitleBar } from '@/features/dashboard/TitleBar';

export default function BillingRoute() {
  return (
    <>
      <TitleBar
        title="Planes y facturación"
        description="Gestioná tu suscripción"
      />
      <BillingPage />
    </>
  );
}
