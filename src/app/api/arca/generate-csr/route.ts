import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as forge from 'node-forge';

export async function POST(req: Request) {
  const { orgId, orgRole } = await auth();
  if (!orgId || orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { cuit, razonSocial, alias } = await req.json();
  if (!cuit || !razonSocial || !alias) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  const cuitClean = cuit.replace(/\D/g, '');

  const keys = forge.pki.rsa.generateKeyPair(2048);

  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([
    { name: 'countryName', value: 'AR' },
    { name: 'organizationName', value: razonSocial },
    { shortName: 'serialNumber', value: `CUIT ${cuitClean}` },
    { name: 'commonName', value: alias },
  ]);
  csr.sign(keys.privateKey, forge.md.sha256.create());

  return NextResponse.json({
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    csr: forge.pki.certificationRequestToPem(csr),
  });
}
