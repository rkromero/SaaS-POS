import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { arcaConfigSchema } from '@/models/Schema';

export async function GET() {
  const { orgId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [config] = await db
    .select()
    .from(arcaConfigSchema)
    .where(eq(arcaConfigSchema.organizationId, orgId));

  // No devolver cert ni privateKey en GET por seguridad
  if (config) {
    const { cert, privateKey, ...safe } = config;
    return NextResponse.json({
      ...safe,
      hasCert: !!cert,
      hasPrivateKey: !!privateKey,
    });
  }

  return NextResponse.json(null);
}

export async function PUT(request: Request) {
  const { orgId, orgRole } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const {
    cuit,
    razonSocial,
    puntoVenta,
    tipoContribuyente,
    ambiente,
    cert,
    privateKey,
    isActive,
  } = body;

  if (!cuit || !razonSocial || !puntoVenta || !tipoContribuyente) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  // Get existing config to preserve cert/key if not provided
  const [existing] = await db
    .select({ cert: arcaConfigSchema.cert, privateKey: arcaConfigSchema.privateKey })
    .from(arcaConfigSchema)
    .where(eq(arcaConfigSchema.organizationId, orgId));

  const [result] = await db
    .insert(arcaConfigSchema)
    .values({
      organizationId: orgId,
      cuit: cuit.replace(/\D/g, ''),
      razonSocial,
      puntoVenta: Number(puntoVenta),
      tipoContribuyente,
      ambiente: ambiente ?? 'sandbox',
      cert: cert || existing?.cert || null,
      privateKey: privateKey || existing?.privateKey || null,
      isActive: isActive ?? false,
    })
    .onConflictDoUpdate({
      target: arcaConfigSchema.organizationId,
      set: {
        cuit: cuit.replace(/\D/g, ''),
        razonSocial,
        puntoVenta: Number(puntoVenta),
        tipoContribuyente,
        ambiente: ambiente ?? 'sandbox',
        ...(cert ? { cert } : {}),
        ...(privateKey ? { privateKey } : {}),
        isActive: isActive ?? false,
        updatedAt: new Date(),
      },
    })
    .returning();

  const { cert: _c, privateKey: _k, ...safe } = result;
  return NextResponse.json({ ...safe, hasCert: !!result.cert, hasPrivateKey: !!result.privateKey });
}
