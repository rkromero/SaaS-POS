import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { arcaConfigSchema } from '@/models/Schema';

/** Normaliza un certificado PEM: maneja BOM, CRLF, CR suelto, y base64 puro */
function normalizePem(raw: string): string {
  // Strip BOM and normalize all line endings to \n
  const s = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (s.startsWith('-----BEGIN')) {
    return s;
  }
  // Base64 puro sin headers → envolver en PEM
  const clean = s.replace(/\s/g, '');
  const lines = clean.match(/.{1,64}/g) ?? [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;
}

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

  if (!cuit || !razonSocial || !tipoContribuyente) {
    return NextResponse.json({ error: 'Faltan campos requeridos: CUIT, razón social y tipo de contribuyente' }, { status: 400 });
  }
  if (isActive && !puntoVenta) {
    return NextResponse.json({ error: 'Se requiere el punto de venta para activar ARCA' }, { status: 400 });
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
      puntoVenta: puntoVenta ? Number(puntoVenta) : 0,
      tipoContribuyente,
      ambiente: ambiente ?? 'sandbox',
      cert: cert ? normalizePem(cert) : existing?.cert || null,
      privateKey: privateKey || existing?.privateKey || null,
      isActive: isActive ?? false,
    })
    .onConflictDoUpdate({
      target: arcaConfigSchema.organizationId,
      set: {
        cuit: cuit.replace(/\D/g, ''),
        razonSocial,
        puntoVenta: puntoVenta ? Number(puntoVenta) : 0,
        tipoContribuyente,
        ambiente: ambiente ?? 'sandbox',
        ...(cert ? { cert: normalizePem(cert) } : {}),
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
