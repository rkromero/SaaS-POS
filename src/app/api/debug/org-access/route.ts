// Endpoint de diagnóstico temporal — muestra el acceso de la org actual.
// REMOVER en producción una vez resuelto el debugging.
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getOrgAccess } from '@/libs/OrgAccess';

export async function GET() {
  const { orgId, userId } = await auth();

  if (!orgId) {
    return NextResponse.json({ error: 'Sin orgId en la sesión. El usuario no está en ninguna organización activa.' });
  }

  const access = await getOrgAccess(orgId);

  return NextResponse.json({
    userId,
    orgId,
    planType: access.planType,
    licenseType: access.licenseType,
    planExpired: access.planExpired,
    isProOrBetter: access.isProOrBetter,
    modules: access.modules,
    hasArca: access.hasModule('arca'),
  });
}
