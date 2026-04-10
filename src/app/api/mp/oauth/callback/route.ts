import { Buffer } from 'node:buffer';

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';

type MpTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
  public_key: string;
  live_mode: boolean;
};

// GET /api/mp/oauth/callback — MP redirige acá después de que el usuario autoriza
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');

  // El usuario canceló o hubo error en MP
  if (error || !code || !stateParam) {
    return NextResponse.redirect(`${appUrl}/dashboard/mp-control?error=cancelled`);
  }

  // Decodificar state para obtener orgId
  let orgId: string;
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
    orgId = decoded.orgId;
    if (!orgId) {
      throw new Error('no orgId');
    }
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/mp-control?error=invalid_state`);
  }

  const appId = process.env.MP_APP_ID;
  const appSecret = process.env.MP_APP_SECRET;
  const callbackUrl = `${appUrl}/api/mp/oauth/callback`;

  if (!appId || !appSecret) {
    return NextResponse.redirect(`${appUrl}/dashboard/mp-control?error=config`);
  }

  // Intercambiar código por access_token
  let tokenData: MpTokenResponse;
  try {
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[MP OAuth] Token exchange failed:', errBody);
      return NextResponse.redirect(`${appUrl}/dashboard/mp-control?error=token_exchange`);
    }

    tokenData = await tokenRes.json();
  } catch (err) {
    console.error('[MP OAuth] Token exchange error:', err);
    return NextResponse.redirect(`${appUrl}/dashboard/mp-control?error=token_exchange`);
  }

  // Registrar webhook en MP para recibir notificaciones de pagos
  let webhookId: string | null = null;
  try {
    const webhookRes = await fetch('https://api.mercadopago.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        url: `${appUrl}/api/webhooks/mp`,
        events: ['payment', 'merchant_order'],
      }),
    });

    if (webhookRes.ok) {
      const webhookData = await webhookRes.json();
      webhookId = String(webhookData.id ?? '');
    } else {
      // El webhook no es crítico — guardamos el token igual
      console.warn('[MP OAuth] Webhook registration failed:', await webhookRes.text());
    }
  } catch (err) {
    console.warn('[MP OAuth] Webhook registration error:', err);
  }

  // Guardar tokens en la org
  await db
    .update(organizationSchema)
    .set({
      mpOauthAccessToken: tokenData.access_token,
      mpOauthRefreshToken: tokenData.refresh_token ?? null,
      mpOauthUserId: String(tokenData.user_id),
      mpWebhookId: webhookId,
    })
    .where(eq(organizationSchema.id, orgId));

  return NextResponse.redirect(`${appUrl}/dashboard/mp-control?connected=true`);
}
