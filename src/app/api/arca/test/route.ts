import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as forge from 'node-forge';

import { getLastVoucher } from '@/libs/arcaClient';
import { db } from '@/libs/DB';
import { arcaConfigSchema } from '@/models/Schema';

export async function POST() {
  const { orgId, orgRole } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [config] = await db
    .select()
    .from(arcaConfigSchema)
    .where(eq(arcaConfigSchema.organizationId, orgId));

  if (!config) {
    return NextResponse.json({ error: 'No hay configuración ARCA guardada' }, { status: 400 });
  }
  if (!config.cert || !config.privateKey) {
    return NextResponse.json({ error: 'Faltan el certificado o la clave privada' }, { status: 400 });
  }
  if (!config.puntoVenta) {
    return NextResponse.json({ error: 'Falta configurar el punto de venta' }, { status: 400 });
  }

  try {
    // Validate cert + key match before calling ARCA to give a clear error
    try {
      const cert = forge.pki.certificateFromPem(config.cert);
      const privKey = forge.pki.privateKeyFromPem(config.privateKey) as forge.pki.rsa.PrivateKey;
      const certPubKey = cert.publicKey as forge.pki.rsa.PublicKey;
      if (certPubKey.n.toString(16) !== privKey.n.toString(16)) {
        return NextResponse.json(
          { error: 'La clave privada no coincide con el certificado. Volvé al Paso 3, generá un nuevo CSR y subí el .crt que ARCA te devuelva para ese CSR.' },
          { status: 400 },
        );
      }
    } catch (parseErr: any) {
      return NextResponse.json(
        { error: `Certificado o clave privada inválidos: ${parseErr?.message ?? parseErr}` },
        { status: 400 },
      );
    }

    const arcaConfig = {
      cuit: config.cuit,
      cert: config.cert,
      privateKey: config.privateKey,
      ambiente: config.ambiente as 'sandbox' | 'production',
    };

    const cbteTipo = config.tipoContribuyente === 'monotributo' ? 11 : 6;
    await getLastVoucher(arcaConfig, config.puntoVenta, cbteTipo);

    return NextResponse.json({ ok: true, message: 'Conexión exitosa con ARCA' });
  } catch (error: any) {
    const msg = error?.message ?? String(error);
    console.error('[arca/test] Error completo:', msg);
    return NextResponse.json(
      { error: `Error al conectar con ARCA: ${msg}` },
      { status: 400 },
    );
  }
}
