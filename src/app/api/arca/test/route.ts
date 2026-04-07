import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

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
    return NextResponse.json(
      { error: `Error al conectar con ARCA: ${msg}` },
      { status: 400 },
    );
  }
}
