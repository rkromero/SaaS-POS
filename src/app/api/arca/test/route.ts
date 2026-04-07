import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

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

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Afip = require('afip');
    const afip = new Afip({
      CUIT: Number(config.cuit),
      cert: config.cert,
      key: config.privateKey,
      production: config.ambiente === 'production',
      res_folder: '/tmp',
      ta_folder: '/tmp',
    });

    // Test: obtener último comprobante emitido
    const cbteTipo = config.tipoContribuyente === 'monotributo' ? 11 : 6;
    await afip.ElectronicBilling.getLastVoucher(config.puntoVenta, cbteTipo);

    return NextResponse.json({ ok: true, message: 'Conexión exitosa con ARCA' });
  } catch (error: any) {
    const msg = error?.message ?? String(error);
    return NextResponse.json(
      { error: `Error al conectar con ARCA: ${msg}` },
      { status: 400 },
    );
  }
}
