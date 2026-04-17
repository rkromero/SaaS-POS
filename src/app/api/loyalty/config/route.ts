import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { loyaltyConfigSchema } from '@/models/Schema';

// GET /api/loyalty/config — obtener configuración del programa de puntos
export async function GET(_request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [config] = await db
    .select()
    .from(loyaltyConfigSchema)
    .where(eq(loyaltyConfigSchema.organizationId, orgId));

  // Si no existe configuración, devuelve los valores por defecto
  if (!config) {
    return NextResponse.json({
      organizationId: orgId,
      isActive: false,
      pesosPerPoint: '1000',
      minPointsToRedeem: 0,
      pointsExpiryDays: null,
      updatedByUserId: null,
      updatedAt: null,
    });
  }

  return NextResponse.json(config);
}

// PUT /api/loyalty/config — actualizar configuración (solo admins)
export async function PUT(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Solo administradores pueden cambiar esta configuración' }, { status: 403 });
  }

  const body = await request.json();
  const { isActive, pesosPerPoint, minPointsToRedeem, pointsExpiryDays } = body;

  if (typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'isActive es requerido' }, { status: 400 });
  }
  if (pesosPerPoint !== undefined && (Number(pesosPerPoint) <= 0)) {
    return NextResponse.json({ error: 'pesosPerPoint debe ser mayor a 0' }, { status: 400 });
  }
  if (minPointsToRedeem !== undefined && (Number(minPointsToRedeem) < 0)) {
    return NextResponse.json({ error: 'minPointsToRedeem debe ser mayor o igual a 0' }, { status: 400 });
  }

  const values = {
    organizationId: orgId,
    isActive,
    pesosPerPoint: pesosPerPoint !== undefined ? String(Number(pesosPerPoint).toFixed(2)) : '1000',
    minPointsToRedeem: minPointsToRedeem !== undefined ? Number(minPointsToRedeem) : 0,
    pointsExpiryDays: pointsExpiryDays ? Number(pointsExpiryDays) : null,
    updatedByUserId: userId,
    updatedAt: new Date(),
  };

  // Upsert: si ya existe la config la actualiza, si no la crea
  const [updated] = await db
    .insert(loyaltyConfigSchema)
    .values(values)
    .onConflictDoUpdate({
      target: loyaltyConfigSchema.organizationId,
      set: {
        isActive: values.isActive,
        pesosPerPoint: values.pesosPerPoint,
        minPointsToRedeem: values.minPointsToRedeem,
        pointsExpiryDays: values.pointsExpiryDays,
        updatedByUserId: values.updatedByUserId,
        updatedAt: values.updatedAt,
      },
    })
    .returning();

  return NextResponse.json(updated);
}
