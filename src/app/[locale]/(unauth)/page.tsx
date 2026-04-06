import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';

import { LandingPage } from '@/templates/LandingPage';

export const metadata: Metadata = {
  title: 'TuCaja — El POS que entiende tu negocio',
  description:
    'Sistema de punto de venta para kioskos, almacenes y despensas en Argentina. Cobrá en segundos, manejá el stock, seguí el fiado y cerrá la caja sin hacer cuentas.',
};

const IndexPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);
  return <LandingPage />;
};

export default IndexPage;
