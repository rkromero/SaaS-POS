import crypto from 'node:crypto';

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as forge from 'node-forge';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { orgId, orgRole } = await auth();
    if (!orgId || orgRole !== 'org:admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { cuit, razonSocial, alias } = body;
    if (!cuit || !razonSocial || !alias) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const cuitClean = String(cuit).replace(/\D/g, '');

    // Generate key pair using Node's native OpenSSL (fast, no Web Workers)
    const { privateKey: nativePrivKey, publicKey: nativePubKey } = await new Promise<{
      privateKey: crypto.KeyObject;
      publicKey: crypto.KeyObject;
    }>((resolve, reject) => {
      crypto.generateKeyPair('rsa', { modulusLength: 2048 }, (err, pub, priv) => {
        if (err) {
          reject(err);
        } else {
          resolve({ privateKey: priv, publicKey: pub });
        }
      });
    });

    // Export both as PKCS1 PEM for forge compatibility
    const privateKeyPem = nativePrivKey.export({ type: 'pkcs1', format: 'pem' }) as string;
    const publicKeyPem = nativePubKey.export({ type: 'pkcs1', format: 'pem' }) as string;

    // Build CSR with forge (fast once keys are ready)
    const forgePrivKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const forgePubKey = forge.pki.publicKeyFromPem(publicKeyPem);

    const csr = forge.pki.createCertificationRequest();
    csr.publicKey = forgePubKey;
    csr.setSubject([
      { name: 'countryName', value: 'AR' },
      { name: 'organizationName', value: String(razonSocial) },
      { type: '2.5.4.5', value: `CUIT ${cuitClean}` },
      { name: 'commonName', value: String(alias) },
    ]);
    csr.sign(forgePrivKey as forge.pki.rsa.PrivateKey, forge.md.sha256.create());

    return NextResponse.json({
      privateKey: privateKeyPem,
      csr: forge.pki.certificationRequestToPem(csr),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[generate-csr]', message);
    return NextResponse.json({ error: `Error interno: ${message}` }, { status: 500 });
  }
}
