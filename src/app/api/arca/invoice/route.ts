import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { createVoucher, getLastVoucher } from '@/libs/arcaClient';
import { db } from '@/libs/DB';
import { arcaConfigSchema, saleSchema } from '@/models/Schema';

// POST /api/arca/invoice
// Genera CAE para una venta ya registrada
export async function POST(request: Request) {
  const { orgId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { saleId, buyerType, buyerCuit } = body;
  // buyerType: 'consumidor_final' | 'con_cuit'

  if (!saleId) {
    return NextResponse.json({ error: 'saleId requerido' }, { status: 400 });
  }

  // Obtener config ARCA
  const [config] = await db
    .select()
    .from(arcaConfigSchema)
    .where(eq(arcaConfigSchema.organizationId, orgId));

  if (!config?.isActive || !config.cert || !config.privateKey) {
    return NextResponse.json({ error: 'ARCA no está configurado o activo' }, { status: 400 });
  }

  // Obtener venta
  const [sale] = await db
    .select()
    .from(saleSchema)
    .where(and(eq(saleSchema.id, Number(saleId)), eq(saleSchema.organizationId, orgId)));

  if (!sale) {
    return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
  }

  try {
    const arcaConfig = {
      cuit: config.cuit,
      cert: config.cert,
      privateKey: config.privateKey,
      ambiente: config.ambiente as 'sandbox' | 'production',
    };

    const isMonotributo = config.tipoContribuyente === 'monotributo';

    // Tipo de comprobante:
    // Monotributo → C (11) siempre
    // RI + consumidor final → B (6)
    // RI + con CUIT → A (1)
    let cbteTipo: number;
    let invoiceType: 'A' | 'B' | 'C';
    if (isMonotributo) {
      cbteTipo = 11;
      invoiceType = 'C';
    } else if (buyerType === 'con_cuit') {
      cbteTipo = 1;
      invoiceType = 'A';
    } else {
      cbteTipo = 6;
      invoiceType = 'B';
    }

    // Obtener último número de comprobante
    const lastVoucher = await getLastVoucher(arcaConfig, config.puntoVenta, cbteTipo);
    const nextNumber = lastVoucher + 1;

    // Datos del comprador
    const docTipo = buyerType === 'con_cuit' ? 80 : 99; // 80=CUIT, 99=Consumidor Final
    const docNro = buyerType === 'con_cuit' && buyerCuit
      ? Number(String(buyerCuit).replace(/\D/g, ''))
      : 0;

    const total = Number(sale.total);
    const date = new Date(sale.createdAt);
    const dateFmt = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    // IVA según tipo de contribuyente
    let impNeto: number;
    let impIva: number;
    let iva: Array<{ Id: number; BaseImp: number; Importe: number }>;

    if (isMonotributo) {
      // Monotributo: sin IVA
      impNeto = total;
      impIva = 0;
      iva = [];
    } else {
      // RI con IVA 21%
      impNeto = Math.round((total / 1.21) * 100) / 100;
      impIva = Math.round((total - impNeto) * 100) / 100;
      iva = [{ Id: 5, BaseImp: impNeto, Importe: impIva }];
    }

    const result = await createVoucher(arcaConfig, {
      CantReg: 1,
      PtoVta: config.puntoVenta,
      CbteTipo: cbteTipo,
      Concepto: 1, // Productos
      DocTipo: docTipo,
      DocNro: docNro,
      CbteDesde: nextNumber,
      CbteHasta: nextNumber,
      CbteFch: Number(dateFmt),
      ImpTotal: total,
      ImpTotConc: 0,
      ImpNeto: impNeto,
      ImpOpEx: 0,
      ImpIVA: impIva,
      ImpTrib: 0,
      MonId: 'PES',
      MonCotiz: 1,
      Iva: iva,
    });

    const cae = result.CAE;
    const caeVencimiento = result.CAEFchVto;
    const invoiceFullNumber = `${String(config.puntoVenta).padStart(4, '0')}-${String(nextNumber).padStart(8, '0')}`;

    // Actualizar venta con datos del CAE
    await db
      .update(saleSchema)
      .set({ cae, caeVencimiento, invoiceNumber: nextNumber, invoiceType, invoiceFullNumber })
      .where(eq(saleSchema.id, Number(saleId)));

    return NextResponse.json({ cae, caeVencimiento, invoiceNumber: nextNumber, invoiceType, invoiceFullNumber });
  } catch (error: any) {
    const msg = error?.message ?? String(error);
    return NextResponse.json({ error: `Error ARCA: ${msg}` }, { status: 500 });
  }
}
