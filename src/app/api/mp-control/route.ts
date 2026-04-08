import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { getOrgAccess } from '@/libs/OrgAccess';
import { mpNotificationSchema, organizationSchema } from '@/models/Schema';

// GET /api/mp-control — estado de conexión + notificaciones recientes
export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getOrgAccess(orgId);
  if (!access.hasModule('mp_control')) {
    return NextResponse.json({ error: 'Módulo no disponible' }, { status: 403 });
  }

  const [org] = await db
    .select({
      mpOauthUserId: organizationSchema.mpOauthUserId,
      mpOauthAccessToken: organizationSchema.mpOauthAccessToken,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId));

  const isConnected = Boolean(org?.mpOauthAccessToken);

  if (!isConnected) {
    return NextResponse.json({ isConnected: false, notifications: [] });
  }

  const notifications = await db
    .select()
    .from(mpNotificationSchema)
    .where(eq(mpNotificationSchema.orgId, orgId))
    .orderBy(desc(mpNotificationSchema.createdAt))
    .limit(100);

  return NextResponse.json({ isConnected: true, mpUserId: org?.mpOauthUserId, notifications });
}

// DELETE /api/mp-control — desconectar la cuenta de MP
export async function DELETE() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getOrgAccess(orgId);
  if (!access.hasModule('mp_control')) {
    return NextResponse.json({ error: 'Módulo no disponible' }, { status: 403 });
  }

  await db
    .update(organizationSchema)
    .set({
      mpOauthAccessToken: null,
      mpOauthRefreshToken: null,
      mpOauthUserId: null,
      mpWebhookId: null,
    })
    .where(eq(organizationSchema.id, orgId));

  return NextResponse.json({ disconnected: true });
}
