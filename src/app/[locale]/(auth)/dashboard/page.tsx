import { TitleBar } from '@/features/dashboard/TitleBar';
import { DashboardMetrics } from '@/features/dashboard-metrics/DashboardMetrics';

const DashboardIndexPage = () => {
  return (
    <>
      <TitleBar
        title="Dashboard"
        description="Resumen de tu negocio"
      />
      <DashboardMetrics />
    </>
  );
};

export default DashboardIndexPage;
