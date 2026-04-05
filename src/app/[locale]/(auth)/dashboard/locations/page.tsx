import { auth } from '@clerk/nextjs/server';

import { TitleBar } from '@/features/dashboard/TitleBar';
import { LocationList } from '@/features/locations/LocationList';

export default async function LocationsPage() {
  const { orgRole } = await auth();
  const isAdmin = orgRole === 'org:admin';

  return (
    <>
      <TitleBar
        title="Locales"
        description="Gestioná las sucursales y locales de tu organización"
      />
      <div className="rounded-md bg-card p-6 shadow-sm">
        <LocationList isAdmin={isAdmin} />
      </div>
    </>
  );
}
