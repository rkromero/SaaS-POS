import crypto from 'node:crypto';

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as forge from 'node-forge';

export const maxDuration = 30;

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

  // Node native crypto (OpenSSL) — async, fast, no Web Workers needed
  const { privateKey: nativeKey } = await new Promise<crypto.KeyPairKeyObjectResult>(
    (resolve, reject) => {
      crypto.generateKeyPair('rsa', { modulusLength: 2048 }, (err, pub, priv) => {
        if (err) {
          reject(err);
        } else {
          resolve({ privateKey: priv, publicKey: pub });
        }
      });
    },
  );

  // Export as PKCS1 PEM so forge can parse it
  const privateKeyPem = nativeKey.export({ type: 'pkcs1', format: 'pem' }) as string;

  // Use forge only for CSR creation (fast once the key is ready)
  const forgeKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const forgePublicKey = forge.pki.setRsaPublicKey(
    (forgeKey as forge.pki.rsa.PrivateKey).n,
    (forgeKey as forge.pki.rsa.PrivateKey).e,
  );

  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = forgePublicKey;
  csr.setSubject([
    { name: 'countryName', value: 'AR' },
    { name: 'organizationName', value: razonSocial },
    { shortName: 'serialNumber', value: `CUIT ${cuitClean}` },
    { name: 'commonName', value: alias },
  ]);
  csr.sign(forgeKey as forge.pki.rsa.PrivateKey, forge.md.sha256.create());

  return NextResponse.json({
    privateKey: privateKeyPem,
    csr: forge.pki.certificationRequestToPem(csr),
  });
}
