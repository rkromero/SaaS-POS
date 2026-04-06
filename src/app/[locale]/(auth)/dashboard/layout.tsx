import { getTranslations } from 'next-intl/server';

import { DashboardSidebar } from '@/features/dashboard/DashboardSidebar';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted">
      <DashboardSidebar />

      {/* Main content — offset by sidebar width on desktop */}
      <main className="lg:pl-56">
        {/* Mobile top bar spacer is handled inside DashboardSidebar */}
        <div className="px-4 pb-16 pt-6 sm:px-6">
          {props.children}
        </div>
      </main>
    </div>
  );
}

export const dynamic = 'force-dynamic';
