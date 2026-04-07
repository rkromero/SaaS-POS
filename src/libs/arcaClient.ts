/**
 * arcaClient.ts — Cliente ARCA/AFIP para entornos serverless
 * Reemplaza el paquete `afip` que usa EJS templates (incompatible con Vercel).
 * Usa node-forge para firmar CMS/PKCS7 y fetch nativo para SOAP.
 */

import * as forge from 'node-forge';

// ─── Endpoints ────────────────────────────────────────────────────────────────
const WSAA_URL = {
  sandbox: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
  production: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
};
const WSFE_URL = {
  sandbox: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  production: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type Ambiente = 'sandbox' | 'production';

export type ArcaAuthConfig = {
  cuit: string;
  cert: string;
  privateKey: string;
  ambiente: Ambiente;
};

export type VoucherData = {
  CantReg: number;
  PtoVta: number;
  CbteTipo: number;
  Concepto: number;
  DocTipo: number;
  DocNro: number;
  CbteDesde: number;
  CbteHasta: number;
  CbteFch: number;
  ImpTotal: number;
  ImpTotConc: number;
  ImpNeto: number;
  ImpOpEx: number;
  ImpIVA: number;
  ImpTrib: number;
  MonId: string;
  MonCotiz: number;
  Iva?: Array<{ Id: number; BaseImp: number; Importe: number }>;
};

export type VoucherResult = {
  CAE: string;
  CAEFchVto: string;
};

// ─── Helpers de XML ──────────────────────────────────────────────────────────
function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1]!.trim() : null;
}

function toIsoAr(date: Date): string {
  // Formato: 2024-01-15T10:00:00-03:00
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}-03:00`;
}

// ─── WSAA: firma CMS/PKCS7 + obtención de token ──────────────────────────────
function buildLoginTicketRequest(): string {
  const now = new Date();
  const from = new Date(now.getTime() - 10 * 60 * 1000);
  const to = new Date(now.getTime() + 10 * 60 * 1000);
  const uniqueId = Math.floor(now.getTime() / 1000);

  return `<?xml version="1.0" encoding="UTF-8"?><loginTicketRequest version="1.0"><header><uniqueId>${uniqueId}</uniqueId><generationTime>${toIsoAr(from)}</generationTime><expirationTime>${toIsoAr(to)}</expirationTime></header><service>wsfe</service></loginTicketRequest>`;
}

function signCMS(xml: string, certPem: string, keyPem: string): string {
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(xml, 'utf8');

  const cert = forge.pki.certificateFromPem(certPem);
  const key = forge.pki.privateKeyFromPem(keyPem);

  p7.addCertificate(cert);
  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256 as string,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType as string, value: forge.pki.oids.data as string },
      { type: forge.pki.oids.messageDigest as string },
      { type: forge.pki.oids.signingTime as string, value: new Date() as unknown as string },
    ],
  });
  p7.sign({ detached: false });

  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return forge.util.encode64(der);
}

async function getToken(config: ArcaAuthConfig): Promise<{ token: string; sign: string }> {
  const xml = buildLoginTicketRequest();
  const cms = signCMS(xml, config.cert, config.privateKey);
  const url = WSAA_URL[config.ambiente];

  const soap = `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov"><soapenv:Header/><soapenv:Body><wsaa:loginCms><wsaa:in0>${cms}</wsaa:in0></wsaa:loginCms></soapenv:Body></soapenv:Envelope>`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=UTF-8', 'SOAPAction': '' },
    body: soap,
  });

  const text = await res.text();

  const token = extractTag(text, 'token');
  const sign = extractTag(text, 'sign');

  if (!token || !sign) {
    const faultstring = extractTag(text, 'faultstring');
    throw new Error(faultstring ?? `WSAA sin token. Respuesta: ${text.slice(0, 300)}`);
  }

  return { token, sign };
}

// ─── WSFE: comprobantes ───────────────────────────────────────────────────────
function buildWsfeAuth(token: string, sign: string, cuit: string): string {
  return `<Auth><Token>${token}</Token><Sign>${sign}</Sign><Cuit>${cuit}</Cuit></Auth>`;
}

/**
 * Obtiene el número del último comprobante autorizado para un punto de venta y tipo.
 */
export async function getLastVoucher(
  config: ArcaAuthConfig,
  puntoVenta: number,
  cbteTipo: number,
): Promise<number> {
  const { token, sign } = await getToken(config);
  const url = WSFE_URL[config.ambiente];

  const soap = `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/"><soapenv:Header/><soapenv:Body><ar:FECompUltimoAutorizado>${buildWsfeAuth(token, sign, config.cuit)}<ar:PtoVta>${puntoVenta}</ar:PtoVta><ar:CbteTipo>${cbteTipo}</ar:CbteTipo></ar:FECompUltimoAutorizado></soapenv:Body></soapenv:Envelope>`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=UTF-8',
      'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado',
    },
    body: soap,
  });

  const text = await res.text();

  // Verificar errores WSFE
  const errMsg = extractTag(text, 'ErrMsg');
  if (errMsg) {
    throw new Error(`WSFE error: ${errMsg}`);
  }

  const cbteNro = extractTag(text, 'CbteNro');
  if (cbteNro === null) {
    throw new Error(`WSFE: respuesta inesperada. ${text.slice(0, 300)}`);
  }

  return Number.parseInt(cbteNro, 10);
}

/**
 * Solicita un CAE para un comprobante electrónico.
 */
export async function createVoucher(
  config: ArcaAuthConfig,
  data: VoucherData,
): Promise<VoucherResult> {
  const { token, sign } = await getToken(config);
  const url = WSFE_URL[config.ambiente];

  const ivaXml = (data.Iva ?? [])
    .map(i => `<AlicIva><Id>${i.Id}</Id><BaseImp>${i.BaseImp}</BaseImp><Importe>${i.Importe}</Importe></AlicIva>`)
    .join('');

  const soap = `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/"><soapenv:Header/><soapenv:Body><ar:FECAESolicitar>${buildWsfeAuth(token, sign, config.cuit)}<ar:FeCAEReq><ar:FeCabReq><ar:CantReg>${data.CantReg}</ar:CantReg><ar:PtoVta>${data.PtoVta}</ar:PtoVta><ar:CbteTipo>${data.CbteTipo}</ar:CbteTipo></ar:FeCabReq><ar:FeDetReq><ar:FECAEDetRequest><ar:Concepto>${data.Concepto}</ar:Concepto><ar:DocTipo>${data.DocTipo}</ar:DocTipo><ar:DocNro>${data.DocNro}</ar:DocNro><ar:CbteDesde>${data.CbteDesde}</ar:CbteDesde><ar:CbteHasta>${data.CbteHasta}</ar:CbteHasta><ar:CbteFch>${data.CbteFch}</ar:CbteFch><ar:ImpTotal>${data.ImpTotal}</ar:ImpTotal><ar:ImpTotConc>${data.ImpTotConc}</ar:ImpTotConc><ar:ImpNeto>${data.ImpNeto}</ar:ImpNeto><ar:ImpOpEx>${data.ImpOpEx}</ar:ImpOpEx><ar:ImpIVA>${data.ImpIVA}</ar:ImpIVA><ar:ImpTrib>${data.ImpTrib}</ar:ImpTrib><ar:MonId>${data.MonId}</ar:MonId><ar:MonCotiz>${data.MonCotiz}</ar:MonCotiz>${ivaXml ? `<ar:Iva>${ivaXml}</ar:Iva>` : ''}</ar:FECAEDetRequest></ar:FeDetReq></ar:FeCAEReq></ar:FECAESolicitar></soapenv:Body></soapenv:Envelope>`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=UTF-8',
      'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECAESolicitar',
    },
    body: soap,
  });

  const text = await res.text();

  const resultado = extractTag(text, 'Resultado');
  if (resultado !== 'A') {
    const obs = extractTag(text, 'Msg') ?? extractTag(text, 'ErrMsg') ?? 'Comprobante rechazado';
    throw new Error(`AFIP rechazó el comprobante: ${obs}`);
  }

  const cae = extractTag(text, 'CAE');
  const caeFchVto = extractTag(text, 'CAEFchVto');

  if (!cae || !caeFchVto) {
    throw new Error(`WSFE: CAE no encontrado en respuesta. ${text.slice(0, 300)}`);
  }

  return { CAE: cae, CAEFchVto: caeFchVto };
}
