import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { BrandingPage } from '@/features/branding/BrandingPage';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';

export default async function BrandingRoute() {
  const { orgId, orgRole } = await auth();

  if (orgRole !== 'org:admin') {
    return <p className="text-sm text-muted-foreground">Solo los administradores pueden acceder a esta sección.</p>;
  }

  let isPaidPlan = false;
  if (orgId) {
    const [org] = await db
      .select({ planType: organizationSchema.planType })
      .from(organizationSchema)
      .where(eq(organizationSchema.id, orgId));
    isPaidPlan = !!org && org.planType !== 'free';
  }

  return (
    <>
      <TitleBar
        title="Personalización"
        description="Aplicá la identidad visual de tu negocio"
      />
      <BrandingPage isPaidPlan={isPaidPlan} />
    </>
  );
}
