import { TitleBar } from '@/features/dashboard/TitleBar';
import { FiadoPage } from '@/features/fiado/FiadoPage';

export default function FiadoRoute() {
  return (
    <>
      <TitleBar
        title="Fiado"
        description="Cuenta corriente de clientes"
      />
      <FiadoPage />
    </>
  );
}
