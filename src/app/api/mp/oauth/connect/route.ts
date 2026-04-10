import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getOrgAccess } from '@/libs/OrgAccess';

// GET /api/mp/oauth/connect — inicia el flujo OAuth de Mercado Pago
// Solo disponible si el módulo mp_control está habilitado para la org
export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getOrgAccess(orgId);
  if (!access.hasModule('mp_control')) {
    return NextResponse.json({ error: 'Módulo no disponible' }, { status: 403 });
  }

  const appId = process.env.MP_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

  if (!appId || !appUrl) {
    return NextResponse.json({ error: 'Configuración de MP incompleta' }, { status: 500 });
  }

  // Codificamos orgId en el state para saber a quién pertenece el callback
  const state = Buffer.from(JSON.stringify({ orgId, userId })).toString('base64url');
  const callbackUrl = `${appUrl}/api/mp/oauth/callback`;

  const mpAuthUrl = new URL('https://auth.mercadopago.com/authorization');
  mpAuthUrl.searchParams.set('client_id', appId);
  mpAuthUrl.searchParams.set('response_type', 'code');
  mpAuthUrl.searchParams.set('platform_id', 'mp');
  mpAuthUrl.searchParams.set('state', state);
  mpAuthUrl.searchParams.set('redirect_uri', callbackUrl);

  return NextResponse.redirect(mpAuthUrl.toString());
}
