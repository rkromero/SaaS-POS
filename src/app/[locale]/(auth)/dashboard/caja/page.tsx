import { CajaPage } from '@/features/caja/CajaPage';
import { TitleBar } from '@/features/dashboard/TitleBar';

export default function CajaRoute() {
  return (
    <>
      <TitleBar
        title="Caja"
        description="Apertura y cierre de caja diaria"
      />
      <CajaPage />
    </>
  );
}
