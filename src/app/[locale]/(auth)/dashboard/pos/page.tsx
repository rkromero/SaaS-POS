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
    <div className="h-full">
      <POSScreen orgName={orgName} />
    </div>
  );
}
