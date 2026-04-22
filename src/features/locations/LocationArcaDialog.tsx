'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 1 | 2 | 3 | 4;

type LocationArcaConfig = {
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

type Props = {
  locationId: number;
  locationName: string;
  onClose: () => void;
};

const STEP_TITLES = ['Datos fiscales', 'Punto de venta', 'Certificado digital', 'Probar y activar'];

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

export const LocationArcaDialog = ({ locationId, locationName, onClose }: Props) => {
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Si null → usa config de la org. Si objeto → tiene config propia.
  const [hasOwnConfig, setHasOwnConfig] = useState(false);

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

  const apiBase = `/api/arca/location-config/${locationId}`;

  useEffect(() => {
    fetch(apiBase)
      .then(r => r.json())
      .then((data: LocationArcaConfig | null) => {
        if (data) {
          setHasOwnConfig(true);
          setCuit(formatCuit(data.cuit));
          setRazonSocial(data.razonSocial);
          setPuntoVenta(String(data.puntoVenta));
          setTipoContribuyente(data.tipoContribuyente);
          setAmbiente(data.ambiente);
          setIsActive(data.isActive);
          setHasCert(!!data.hasCert);
          setHasPrivateKey(!!data.hasPrivateKey);
        }
        setLoaded(true);
      });
  }, [apiBase]);

  const save = async (extra: Partial<LocationArcaConfig> = {}) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(apiBase, {
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
      setHasOwnConfig(true);
      return true;
    } catch {
      setError('Error de conexión');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleRevertToOrg = async () => {
    setDeleting(true);
    try {
      await fetch(apiBase, { method: 'DELETE' });
      setHasOwnConfig(false);
      setCuit('');
      setRazonSocial('');
      setPuntoVenta('');
      setIsActive(false);
      setHasCert(false);
      setHasPrivateKey(false);
      setStep(1);
    } finally {
      setDeleting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await save();
    try {
      const res = await fetch('/api/arca/test', { method: 'POST' });
      const data = await res.json();
      setTestResult(res.ok
        ? { ok: true, message: data.message }
        : { ok: false, message: data.error });
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Facturación fiscal —
            {locationName}
          </DialogTitle>
        </DialogHeader>

        {!loaded
          ? (
              <div className="space-y-3">
                {[1, 2, 3].map(k => (
                  <div key={k} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            )
          : (
              <div className="space-y-5">
                {/* Selector: org vs local */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleRevertToOrg}
                    disabled={!hasOwnConfig || deleting}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      !hasOwnConfig
                        ? 'border-primary bg-primary/5'
                        : 'opacity-70 hover:bg-muted'
                    }`}
                  >
                    <div className="text-sm font-medium">Usar CUIT de la organización</div>
                    <div className="text-xs text-muted-foreground">Hereda la configuración fiscal general</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasOwnConfig(true)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      hasOwnConfig
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="text-sm font-medium">CUIT propio para este local</div>
                    <div className="text-xs text-muted-foreground">Factura con razón social y punto de venta independientes</div>
                  </button>
                </div>

                {!hasOwnConfig && (
                  <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    Este local usará la configuración fiscal configurada a nivel organización.
                    Para verla o editarla, andá a
                    {' '}
                    <a href="/dashboard/arca" className="text-primary underline underline-offset-2">
                      Configuración ARCA
                    </a>
                    .
                  </div>
                )}

                {hasOwnConfig && (
                  <>
                    {/* Progress */}
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
                            {s}
                          </button>
                          {s < 4 && <div className={`h-0.5 w-10 ${s < step ? 'bg-primary/40' : 'bg-muted'}`} />}
                        </div>
                      ))}
                      <span className="ml-2 text-sm font-medium">{STEP_TITLES[step - 1]}</span>
                    </div>

                    {isActive && (
                      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                        <span className="size-2 rounded-full bg-green-500" />
                        ARCA activo para este local
                      </div>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                      <section className="space-y-4 rounded-lg border bg-card p-5">
                        <div>
                          <Label>CUIT del local *</Label>
                          <Input
                            value={cuit}
                            onChange={e => setCuit(formatCuit(e.target.value))}
                            placeholder="20-12345678-9"
                            className="font-mono"
                          />
                        </div>
                        <div>
                          <Label>Razón Social *</Label>
                          <p className="mb-1 text-xs text-muted-foreground">Como figura en ARCA</p>
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
                              { value: 'monotributo', label: 'Monotributista', desc: 'Emite Factura C' },
                              { value: 'responsable_inscripto', label: 'Resp. Inscripto', desc: 'Emite Factura A y B' },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setTipoContribuyente(opt.value as any)}
                                className={`rounded-lg border p-3 text-left transition-colors ${
                                  tipoContribuyente === opt.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                                }`}
                              >
                                <div className="text-sm font-medium">{opt.label}</div>
                                <div className="text-xs text-muted-foreground">{opt.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button onClick={nextStep} disabled={saving || !cuit || !razonSocial} className="w-full">
                          {saving ? 'Guardando...' : 'Siguiente →'}
                        </Button>
                      </section>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                      <section className="space-y-4 rounded-lg border bg-card p-5">
                        <div className="space-y-1 rounded-lg bg-muted p-4 text-sm">
                          <p className="font-medium">¿Qué es el punto de venta?</p>
                          <p className="text-muted-foreground">
                            Número que ARCA asigna a cada terminal o sucursal. Registralo en
                            {' '}
                            <strong>ARCA → Facturación → Puntos de venta</strong>
                            .
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
                            placeholder="Ej: 2"
                            className="w-32 font-mono"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Debe ser distinto al punto de venta de la organización
                          </p>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setStep(1)}>← Atrás</Button>
                          <Button onClick={nextStep} disabled={saving || !puntoVenta} className="flex-1">
                            {saving ? 'Guardando...' : 'Siguiente →'}
                          </Button>
                        </div>
                      </section>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                      <section className="space-y-4 rounded-lg border bg-card p-5">
                        <div>
                          <Label>
                            Certificado (.crt)
                            {hasCert && <span className="ml-2 text-xs text-green-600">✓ guardado</span>}
                          </Label>
                          <p className="mb-1 text-xs text-muted-foreground">
                            Pegá el contenido del archivo .crt (comienza con -----BEGIN CERTIFICATE-----)
                          </p>
                          <textarea
                            value={cert}
                            onChange={e => setCert(e.target.value)}
                            placeholder={hasCert
                              ? '(certificado guardado — pegá uno nuevo para actualizarlo)'
                              : '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'}
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                            rows={5}
                          />
                        </div>
                        <div>
                          <Label>
                            Clave privada (.key)
                            {hasPrivateKey && <span className="ml-2 text-xs text-green-600">✓ guardada</span>}
                          </Label>
                          <textarea
                            value={privateKey}
                            onChange={e => setPrivateKey(e.target.value)}
                            placeholder={hasPrivateKey
                              ? '(clave guardada — pegá una nueva para actualizarla)'
                              : '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'}
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                            rows={5}
                          />
                        </div>
                        <div>
                          <Label>Ambiente</Label>
                          <div className="mt-2 grid grid-cols-2 gap-3">
                            {[
                              { value: 'sandbox', label: 'Homologación (pruebas)', desc: 'Sin facturas reales' },
                              { value: 'production', label: 'Producción', desc: 'Facturas con validez fiscal' },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setAmbiente(opt.value as any)}
                                className={`rounded-lg border p-3 text-left transition-colors ${
                                  ambiente === opt.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                                }`}
                              >
                                <div className="text-sm font-medium">{opt.label}</div>
                                <div className="text-xs text-muted-foreground">{opt.desc}</div>
                              </button>
                            ))}
                          </div>
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

                    {/* Step 4 */}
                    {step === 4 && (
                      <section className="space-y-4 rounded-lg border bg-card p-5">
                        <p className="text-sm text-muted-foreground">
                          Probá la conexión con ARCA para verificar que los datos de este local son correctos.
                        </p>
                        <Button variant="outline" onClick={handleTest} disabled={testing} className="w-full">
                          {testing ? 'Probando conexión...' : '🔌 Probar conexión con ARCA'}
                        </Button>

                        {testResult && (
                          <div className={`rounded-lg border p-3 text-sm ${
                            testResult.ok
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-red-200 bg-red-50 text-red-700'
                          }`}
                          >
                            {testResult.ok ? '✓ ' : '✗ '}
                            {testResult.message}
                          </div>
                        )}

                        <div className="border-t pt-4">
                          {isActive
                            ? (
                                <div className="space-y-3">
                                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                    ✓ ARCA activo para este local.
                                  </div>
                                  <Button
                                    variant="outline"
                                    onClick={handleDeactivate}
                                    disabled={saving}
                                    className="w-full text-destructive"
                                  >
                                    {saving ? 'Guardando...' : 'Desactivar ARCA para este local'}
                                  </Button>
                                </div>
                              )
                            : (
                                <div className="space-y-3">
                                  <p className="text-sm text-muted-foreground">
                                    Al activar, las ventas de este local usarán este CUIT para emitir facturas.
                                  </p>
                                  <Button
                                    onClick={handleActivate}
                                    disabled={saving || !testResult?.ok}
                                    className="w-full"
                                  >
                                    {saving ? 'Activando...' : '✓ Activar ARCA para este local'}
                                  </Button>
                                  {!testResult?.ok && (
                                    <p className="text-center text-xs text-muted-foreground">Probá la conexión primero</p>
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

                    {/* Botón volver a org */}
                    <div className="border-t pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRevertToOrg}
                        disabled={deleting}
                        className="text-xs text-muted-foreground"
                      >
                        {deleting ? 'Eliminando...' : 'Quitar config propia y usar la de la organización'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
      </DialogContent>
    </Dialog>
  );
};
