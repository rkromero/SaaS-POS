import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { locationArcaConfigSchema, locationSchema } from '@/models/Schema';

type Params = { params: { locationId: string } };

// Verifica que el local pertenezca a la organización del usuario
async function verifyLocationOwnership(orgId: string, locationId: number) {
  const [loc] = await db
    .select({ organizationId: locationSchema.organizationId })
    .from(locationSchema)
    .where(eq(locationSchema.id, locationId));

  return loc?.organizationId === orgId;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locationId = Number(params.locationId);
    if (!locationId) {
      return NextResponse.json({ error: 'locationId inválido' }, { status: 400 });
    }

    const owns = await verifyLocationOwnership(orgId, locationId);
    if (!owns) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [config] = await db
      .select()
      .from(locationArcaConfigSchema)
      .where(eq(locationArcaConfigSchema.locationId, locationId));

    if (!config) {
      return NextResponse.json(null);
    }

    const { cert, privateKey, ...safe } = config;
    return NextResponse.json({ ...safe, hasCert: !!cert, hasPrivateKey: !!privateKey });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/arca/location-config]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { orgId, orgRole } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const locationId = Number(params.locationId);
  if (!locationId) {
    return NextResponse.json({ error: 'locationId inválido' }, { status: 400 });
  }

  const owns = await verifyLocationOwnership(orgId, locationId);
  if (!owns) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { cuit, razonSocial, puntoVenta, tipoContribuyente, ambiente, cert, privateKey, isActive } = body;

  if (!cuit || !razonSocial || !tipoContribuyente) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: CUIT, razón social y tipo de contribuyente' },
      { status: 400 },
    );
  }
  if (isActive && !puntoVenta) {
    return NextResponse.json({ error: 'Se requiere el punto de venta para activar ARCA' }, { status: 400 });
  }

  const [existing] = await db
    .select({ cert: locationArcaConfigSchema.cert, privateKey: locationArcaConfigSchema.privateKey })
    .from(locationArcaConfigSchema)
    .where(eq(locationArcaConfigSchema.locationId, locationId));

  const [result] = await db
    .insert(locationArcaConfigSchema)
    .values({
      locationId,
      cuit: cuit.replace(/\D/g, ''),
      razonSocial,
      puntoVenta: puntoVenta ? Number(puntoVenta) : 0,
      tipoContribuyente,
      ambiente: ambiente ?? 'sandbox',
      cert: cert || existing?.cert || null,
      privateKey: privateKey || existing?.privateKey || null,
      isActive: isActive ?? false,
    })
    .onConflictDoUpdate({
      target: locationArcaConfigSchema.locationId,
      set: {
        cuit: cuit.replace(/\D/g, ''),
        razonSocial,
        puntoVenta: puntoVenta ? Number(puntoVenta) : 0,
        tipoContribuyente,
        ambiente: ambiente ?? 'sandbox',
        ...(cert ? { cert } : {}),
        ...(privateKey ? { privateKey } : {}),
        isActive: isActive ?? false,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!result) {
    return NextResponse.json({ error: 'No se pudo guardar la configuración' }, { status: 500 });
  }

  const { cert: _c, privateKey: _k, ...safe } = result;
  return NextResponse.json({ ...safe, hasCert: !!result.cert, hasPrivateKey: !!result.privateKey });
}

// DELETE — elimina config del local (vuelve al comportamiento heredado de org)
export async function DELETE(_req: Request, { params }: Params) {
  const { orgId, orgRole } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const locationId = Number(params.locationId);
  if (!locationId) {
    return NextResponse.json({ error: 'locationId inválido' }, { status: 400 });
  }

  const owns = await verifyLocationOwnership(orgId, locationId);
  if (!owns) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db
    .delete(locationArcaConfigSchema)
    .where(eq(locationArcaConfigSchema.locationId, locationId));

  return NextResponse.json({ ok: true });
}
