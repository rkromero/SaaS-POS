import { auth, clerkClient } from '@clerk/nextjs/server';

import { POSScreen } from '@/features/pos/POSScreen';

export default async function POSPage() {
  const { orgId } = await auth();

  let orgName = 'Mi negocio';
  if (orgId) {
    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: orgId });
      orgName = org.name;
    } catch {
      // fallback to default name
    }
  }

  return (
    // Escapa el padding del wrapper del dashboard (px-4 pb-16 pt-6 sm:px-6)
    // para que el POS ocupe el viewport completo y las tabs queden al fondo.
    <div className="-mx-4 -mb-16 -mt-6 h-screen overflow-hidden sm:-mx-6">
      <POSScreen orgName={orgName} />
    </div>
  );
}
