import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { getOrgAccess } from '@/libs/OrgAccess';
import { expirationAlertConfigSchema } from '@/models/Schema';

// GET /api/stock/expiration/config — obtener umbrales configurados
export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getOrgAccess(orgId);
  if (!access.hasModule('stock_expiration')) {
    return NextResponse.json({ error: 'Módulo no disponible' }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(expirationAlertConfigSchema)
    .where(eq(expirationAlertConfigSchema.organizationId, orgId));

  return NextResponse.json(rows);
}

// PUT /api/stock/expiration/config — reemplazar configuración completa de umbrales
// Body: { thresholds: [{ thresholdDays: 30, emailEnabled: false, inAppEnabled: true }, ...] }
export async function PUT(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await getOrgAccess(orgId);
  if (!access.hasModule('stock_expiration')) {
    return NextResponse.json({ error: 'Módulo no disponible' }, { status: 403 });
  }

  const body = await request.json() as {
    thresholds: Array<{ thresholdDays: number; emailEnabled?: boolean; inAppEnabled?: boolean }>;
  };

  if (!Array.isArray(body?.thresholds)) {
    return NextResponse.json({ error: 'thresholds debe ser un array' }, { status: 400 });
  }

  // Validate each threshold
  for (const t of body.thresholds) {
    const days = Number(t.thresholdDays);
    if (Number.isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: `thresholdDays inválido: ${t.thresholdDays}. Debe estar entre 1 y 365.` },
        { status: 400 },
      );
    }
  }

  // Replace all thresholds for this org atomically
  await db.delete(expirationAlertConfigSchema).where(
    eq(expirationAlertConfigSchema.organizationId, orgId),
  );

  if (body.thresholds.length > 0) {
    await db.insert(expirationAlertConfigSchema).values(
      body.thresholds.map(t => ({
        organizationId: orgId,
        thresholdDays: Number(t.thresholdDays),
        emailEnabled: t.emailEnabled ?? false,
        inAppEnabled: t.inAppEnabled ?? true,
      })),
    );
  }

  const saved = await db
    .select()
    .from(expirationAlertConfigSchema)
    .where(eq(expirationAlertConfigSchema.organizationId, orgId));

  return NextResponse.json(saved);
}
