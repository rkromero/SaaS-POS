'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 1 | 2 | 3 | 4;

type ArcaConfig = {
  cuit: string;
  razonSocial: string;
  puntoVenta: string;
  tipoContribuyente: 'monotributo' | 'responsable_inscripto';
  ambiente: 'sandbox' | 'production';
  cert: string;
  privateKey: string;
  isActive: boolean;
  hasCert?: boolean;
  hasPrivateKey?: boolean;
};

const STEP_TITLES = [
  'Datos fiscales',
  'Punto de venta',
  'Certificado digital',
  'Probar y activar',
];

function formatCuit(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

// Traduce errores de ARCA a mensajes accionables para el usuario
function parseArcaError(msg: string): { title: string; detail: string } {
  const m = msg?.toLowerCase() ?? '';

  if (m.includes('certificate') || m.includes('certificado') || m.includes('cert')) {
    return {
      title: 'Certificado inválido',
      detail: 'Verificá que copiaste o subiste el archivo .crt completo. Debe empezar con -----BEGIN CERTIFICATE-----.',
    };
  }
  if (m.includes('private key') || m.includes('clave privada') || m.includes('key')) {
    return {
      title: 'Clave privada inválida',
      detail: 'La clave privada (.key) no coincide con el certificado, o no es válida. Verificá que subiste el archivo correcto.',
    };
  }
  if (m.includes('wsfe') || m.includes('web service')) {
    return {
      title: 'Servicio WSFE no habilitado',
      detail: 'Debés adherir el servicio WSFE en ARCA → Administrador de Relaciones de Clave Fiscal → Adherir servicio.',
    };
  }
  if (m.includes('cuit') || m.includes('contribuyente')) {
    return {
      title: 'CUIT no coincide',
      detail: 'El CUIT ingresado no coincide con el del certificado. Verificá que el certificado fue generado para este CUIT.',
    };
  }
  if (m.includes('punto de venta') || m.includes('pdv')) {
    return {
      title: 'Punto de venta no válido',
      detail: 'El número de punto de venta no está registrado en ARCA. Registralo en ARCA → Facturación → Puntos de venta.',
    };
  }
  if (m.includes('timeout') || m.includes('connection') || m.includes('conexión') || m.includes('network')) {
    return {
      title: 'Error de conectividad',
      detail: 'No se pudo conectar con los servidores de ARCA. Verificá tu conexión a internet e intentá nuevamente.',
    };
  }

  return {
    title: 'Error de conexión con ARCA',
    detail: msg || 'Error desconocido. Si el problema persiste, verificá que todos los datos son correctos.',
  };
}

function useFileReader(setter: (v: string) => void) {
  const ref = useRef<HTMLInputElement>(null);
  const trigger = () => ref.current?.click();
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setter((ev.target?.result as string) ?? '');
    reader.readAsText(file);
    // Reset so the same file can be re-uploaded
    e.target.value = '';
  };
  return { ref, trigger, onChange };
}

export const ArcaWizard = () => {
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [showPrereqs, setShowPrereqs] = useState(false);

  const [cuit, setCuit] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [tipoContribuyente, setTipoContribuyente] = useState<'monotributo' | 'responsable_inscripto'>('monotributo');
  const [puntoVenta, setPuntoVenta] = useState('');
  const [ambiente, setAmbiente] = useState<'sandbox' | 'production'>('sandbox');
  const [cert, setCert] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [hasCert, setHasCert] = useState(false);
  const [hasPrivateKey, setHasPrivateKey] = useState(false);

  const certUpload = useFileReader(setCert);
  const keyUpload = useFileReader(setPrivateKey);

  useEffect(() => {
    fetch('/api/arca/config')
      .then(r => r.json())
      .then((data: ArcaConfig | null) => {
        if (data) {
          setCuit(formatCuit(data.cuit));
          setRazonSocial(data.razonSocial);
          setPuntoVenta(String(data.puntoVenta));
          setTipoContribuyente(data.tipoContribuyente as any);
          setAmbiente(data.ambiente as any);
          setIsActive(data.isActive);
          setHasCert(!!data.hasCert);
          setHasPrivateKey(!!data.hasPrivateKey);
        }
        setLoaded(true);
      });
  }, []);

  const save = async (extra: Partial<ArcaConfig> = {}) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/arca/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuit,
          razonSocial,
          puntoVenta,
          tipoContribuyente,
          ambiente,
          ...(cert ? { cert } : {}),
          ...(privateKey ? { privateKey } : {}),
          isActive,
          ...extra,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Error al guardar');
        return false;
      }
      const d = await res.json();
      setHasCert(!!d.hasCert);
      setHasPrivateKey(!!d.hasPrivateKey);
      return true;
    } catch {
      setError('Error de conexión');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await save();
    try {
      const res = await fetch('/api/arca/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ ok: true, message: data.message });
      } else {
        setTestResult({ ok: false, message: data.error });
      }
    } catch {
      setTestResult({ ok: false, message: 'Error de conexión' });
    } finally {
      setTesting(false);
    }
  };

  const handleActivate = async () => {
    const ok = await save({ isActive: true });
    if (ok) {
      setIsActive(true);
    }
  };

  const handleDeactivate = async () => {
    const ok = await save({ isActive: false });
    if (ok) {
      setIsActive(false);
    }
  };

  const nextStep = async () => {
    const ok = await save();
    if (ok) {
      setStep(s => (s + 1) as Step);
    }
  };

  if (!loaded) {
    return <div className="space-y-3">{[1, 2, 3].map(k => <div key={k} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>;
  }

  const parsedError = testResult && !testResult.ok ? parseArcaError(testResult.message) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Panel de estado si ya está activo */}
      {isActive && (
        <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-green-100">
              <span className="text-lg">✓</span>
            </div>
            <div>
              <p className="font-semibold text-green-800">ARCA activo y funcionando</p>
              <p className="text-sm text-green-700">
                {razonSocial}
                {' '}
                · CUIT
                {cuit}
                {' '}
                · Punto de venta
                {puntoVenta}
                {' '}
                ·
                {ambiente === 'production' ? 'Producción' : 'Homologación'}
              </p>
            </div>
          </div>
          <p className="text-xs text-green-700">
            En el POS aparece la opción "Emitir factura electrónica" en cada venta. Usá el wizard de abajo para modificar la configuración.
          </p>
        </div>
      )}

      {/* Checklist de prereqs colapsable */}
      <div className="rounded-lg border border-amber-200 bg-amber-50">
        <button
          type="button"
          onClick={() => setShowPrereqs(v => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <span className="text-sm font-medium text-amber-800">¿Primera vez? Revisá lo que necesitás antes de empezar</span>
          </div>
          <span className="text-sm text-amber-600">{showPrereqs ? '▲' : '▼'}</span>
        </button>
        {showPrereqs && (
          <div className="space-y-4 border-t border-amber-200 p-4">

            {/* Tarea 1: Habilitar WSFE */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-900">1. Habilitar el servicio de facturación en ARCA</p>
              <p className="text-xs text-amber-700">
                Esto autoriza a tu CUIT a usar la API de facturación electrónica.
              </p>
              <ol className="ml-1 list-inside list-decimal space-y-1 text-xs text-amber-700">
                <li>
                  Ingresá a
                  <strong>serviciosweb.afip.gob.ar</strong>
                  {' '}
                  con tu CUIT y Clave Fiscal nivel 3
                </li>
                <li>
                  Buscá
                  <strong>"Administrador de Relaciones de Clave Fiscal"</strong>
                  {' '}
                  y abrilo
                </li>
                <li>
                  Aparece una lista de organismos — buscá el logo de
                  <strong>ARCA</strong>
                  {' '}
                  y hacé clic
                </li>
                <li>
                  Se despliegan dos opciones: elegí
                  <strong>"WebServices"</strong>
                  {' '}
                  (no "Servicios Interactivos")
                </li>
                <li>
                  En el listado buscá
                  {' '}
                  <strong>"Facturación Electrónica"</strong>
                  {' '}
                  (descripción: "Factura electrónica") y hacé clic para adherirlo
                </li>
              </ol>
              <p className="text-xs italic text-amber-600">
                El nombre técnico es "wsfev1" pero en pantalla aparece como "Facturación Electrónica".
                No es "Factura Electrónica con Detalle - MTXCA" ni "Factura electrónica de exportacion".
              </p>
            </div>

            {/* Tarea 2: Registrar punto de venta */}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900">2. Registrar un punto de venta tipo WebServices</p>
              <ol className="ml-1 list-inside list-decimal space-y-1 text-xs text-amber-700">
                <li>
                  En ARCA, buscá
                  <strong>"Administración de Puntos de Venta"</strong>
                </li>
                <li>
                  Creá un nuevo punto de venta con tipo
                  <strong>"WebServices"</strong>
                </li>
                <li>Anotá el número asignado — lo necesitás en el Paso 2 de este wizard</li>
              </ol>
            </div>

            {/* Tarea 3: Certificado */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-900">3. Obtener el certificado digital (.crt + .key)</p>
              <p className="text-xs text-amber-700">
                El certificado es lo que le permite al sistema identificarse ante ARCA. Se genera una clave privada (.key) y ARCA firma el certificado (.crt).
              </p>
              <p className="text-xs text-amber-700">
                Hay dos formas de obtenerlo:
              </p>
              <div className="space-y-2 text-xs text-amber-700">
                <div className="rounded bg-amber-100 px-2 py-1.5">
                  <p className="font-medium text-amber-800">Opción A — Desde ARCA (más fácil)</p>
                  <ol className="ml-1 mt-1 list-inside list-decimal space-y-0.5">
                    <li>
                      En ARCA, buscá
                      <strong>"Acceso Web Services"</strong>
                      {' '}
                      o
                      <strong>"Certificados Digitales"</strong>
                    </li>
                    <li>Generá un nuevo certificado con un nombre descriptivo (ej: "mi-pos")</li>
                    <li>
                      Descargá el
                      <strong>.crt</strong>
                      {' '}
                      y el
                      <strong>.key</strong>
                      {' '}
                      que genera ARCA
                    </li>
                  </ol>
                </div>
                <div className="rounded bg-amber-100 px-2 py-1.5">
                  <p className="font-medium text-amber-800">Opción B — Con tu contador</p>
                  <p className="mt-0.5">
                    Si no encontrás la opción en el portal, pedile a tu contador que te genere los archivos .crt y .key para el servicio WSFE. Es un trámite estándar.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {([1, 2, 3, 4] as Step[]).map(s => (
          <div key={s} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(s)}
              className={`flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                    ? 'bg-primary/30 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? '✓' : s}
            </button>
            {s < 4 && <div className={`h-0.5 w-10 ${s < step ? 'bg-primary/40' : 'bg-muted'}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm font-medium">{STEP_TITLES[step - 1]}</span>
      </div>

      {/* Step 1: Datos fiscales */}
      {step === 1 && (
        <section className="space-y-4 rounded-lg border bg-card p-5">
          <div>
            <Label>CUIT del negocio *</Label>
            <Input
              value={cuit}
              onChange={e => setCuit(formatCuit(e.target.value))}
              placeholder="20-12345678-9"
              className="font-mono"
            />
          </div>
          <div>
            <Label>Razón Social *</Label>
            <p className="mb-1 text-xs text-muted-foreground">Como figura en ARCA (nombre o razón social registrada)</p>
            <Input
              value={razonSocial}
              onChange={e => setRazonSocial(e.target.value)}
              placeholder="Ej: Juan Pérez o Mi Empresa S.A."
            />
          </div>
          <div>
            <Label>Tipo de contribuyente *</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {[
                { value: 'monotributo', label: 'Monotributista', desc: 'Emite Factura C sin IVA discriminado' },
                { value: 'responsable_inscripto', label: 'Resp. Inscripto', desc: 'Emite Factura A (con CUIT) y B (consumidor final) con IVA' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTipoContribuyente(opt.value as any)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    tipoContribuyente === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={nextStep}
            disabled={saving || !cuit || !razonSocial}
            className="w-full"
          >
            {saving ? 'Guardando...' : 'Siguiente →'}
          </Button>
        </section>
      )}

      {/* Step 2: Punto de venta */}
      {step === 2 && (
        <section className="space-y-4 rounded-lg border bg-card p-5">
          <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium">¿Qué es el punto de venta?</p>
            <p className="text-muted-foreground">
              Es un número que identifica tu terminal de facturación en ARCA. Si todavía no tenés uno,
              registralo en
              {' '}
              <strong>arca.gob.ar → Facturación → Puntos de venta → Administración de puntos de venta</strong>
              .
            </p>
            <p className="text-muted-foreground">
              Elegí el tipo
              {' '}
              <strong>"WebServices"</strong>
              {' '}
              al registrarlo — es el que corresponde a facturación electrónica por sistema.
            </p>
          </div>
          <div>
            <Label>Número de punto de venta *</Label>
            <Input
              type="number"
              min="1"
              max="9999"
              value={puntoVenta}
              onChange={e => setPuntoVenta(e.target.value)}
              placeholder="Ej: 1"
              className="w-32 font-mono"
            />
            <p className="mt-1 text-xs text-muted-foreground">Si es tu primer punto de venta, probablemente sea el número 1</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>← Atrás</Button>
            <Button
              onClick={nextStep}
              disabled={saving || !puntoVenta}
              className="flex-1"
            >
              {saving ? 'Guardando...' : 'Siguiente →'}
            </Button>
          </div>
        </section>
      )}

      {/* Step 3: Certificado digital */}
      {step === 3 && (
        <section className="space-y-4 rounded-lg border bg-card p-5">

          {/* Ambiente primero — afecta las instrucciones */}
          <div>
            <Label>Ambiente</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {[
                { value: 'sandbox', label: 'Homologación (pruebas)', desc: 'Para testear el circuito. Usa certificados de prueba de ARCA.' },
                { value: 'production', label: 'Producción', desc: 'Facturas reales con validez fiscal ante ARCA.' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAmbiente(opt.value as any)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    ambiente === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
            {ambiente === 'sandbox' && (
              <p className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                En homologación podés usar certificados de prueba que ARCA provee. Las facturas generadas no tienen validez fiscal.
              </p>
            )}
          </div>

          {/* Certificado (.crt) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Certificado (.crt)
                {hasCert && <span className="ml-2 text-xs font-normal text-green-600">✓ guardado</span>}
              </Label>
              <div>
                <input
                  ref={certUpload.ref}
                  type="file"
                  accept=".crt,.pem,.cer"
                  className="hidden"
                  onChange={certUpload.onChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={certUpload.trigger}
                  className="h-7 text-xs"
                >
                  📂 Subir archivo .crt
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Subí el archivo .crt directamente, o pegá el contenido abajo (empieza con -----BEGIN CERTIFICATE-----)
            </p>
            <textarea
              value={cert}
              onChange={e => setCert(e.target.value)}
              placeholder={hasCert ? '(certificado guardado — subí o pegá uno nuevo para actualizarlo)' : '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'}
              className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
              rows={4}
            />
          </div>

          {/* Clave privada (.key) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Clave privada (.key)
                {hasPrivateKey && <span className="ml-2 text-xs font-normal text-green-600">✓ guardada</span>}
              </Label>
              <div>
                <input
                  ref={keyUpload.ref}
                  type="file"
                  accept=".key,.pem"
                  className="hidden"
                  onChange={keyUpload.onChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={keyUpload.trigger}
                  className="h-7 text-xs"
                >
                  📂 Subir archivo .key
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Subí el archivo .key directamente, o pegá el contenido abajo
            </p>
            <textarea
              value={privateKey}
              onChange={e => setPrivateKey(e.target.value)}
              placeholder={hasPrivateKey ? '(clave guardada — subí o pegá una nueva para actualizarla)' : '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'}
              className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
              rows={4}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>← Atrás</Button>
            <Button
              onClick={nextStep}
              disabled={saving || (!hasCert && !cert) || (!hasPrivateKey && !privateKey)}
              className="flex-1"
            >
              {saving ? 'Guardando...' : 'Siguiente →'}
            </Button>
          </div>
        </section>
      )}

      {/* Step 4: Test y activar */}
      {step === 4 && (
        <section className="space-y-4 rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Probá la conexión con ARCA para verificar que el certificado y los datos son correctos.
          </p>

          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="w-full"
          >
            {testing ? 'Conectando con ARCA...' : '🔌 Probar conexión con ARCA'}
          </Button>

          {testResult?.ok && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              ✓
              {' '}
              {testResult.message || 'Conexión exitosa. Los datos son correctos.'}
            </div>
          )}

          {testResult && !testResult.ok && parsedError && (
            <div className="space-y-1.5 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-700">
                ✗
                {parsedError.title}
              </p>
              <p className="text-xs text-red-600">{parsedError.detail}</p>
              <div className="border-t border-red-200 pt-1.5 text-xs text-red-500">
                ¿Sigue fallando? Revisá el
                {' '}
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="underline hover:no-underline"
                >
                  Paso 3 (certificados)
                </button>
                {' '}
                y verificá que el CUIT y el punto de venta en ARCA sean los correctos.
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            {isActive
              ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                      ✓ ARCA está activo. Las ventas en el POS incluyen la opción de emitir factura electrónica.
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleDeactivate}
                      disabled={saving}
                      className="w-full text-destructive"
                    >
                      {saving ? 'Guardando...' : 'Desactivar ARCA'}
                    </Button>
                  </div>
                )
              : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Una vez activado, en cada venta del POS aparecerá la opción de emitir factura electrónica.
                    </p>
                    <Button
                      onClick={handleActivate}
                      disabled={saving || !testResult?.ok}
                      className="w-full"
                    >
                      {saving ? 'Activando...' : '✓ Activar facturación ARCA'}
                    </Button>
                    {!testResult?.ok && (
                      <p className="text-center text-xs text-muted-foreground">Probá la conexión primero para activar</p>
                    )}
                  </div>
                )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button variant="outline" onClick={() => setStep(3)} className="w-full">
            ← Volver a certificados
          </Button>
        </section>
      )}
    </div>
  );
};
