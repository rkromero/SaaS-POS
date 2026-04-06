import { TitleBar } from '@/features/dashboard/TitleBar';
import { ReportsPage } from '@/features/reports/ReportsPage';

export default function ReportsRoute() {
  return (
    <>
      <TitleBar
        title="Reportes"
        description="Ventas, gastos y rentabilidad del negocio"
      />
      <ReportsPage />
    </>
  );
}
