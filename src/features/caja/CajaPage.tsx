'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type HistorySession = {
  id: number;
  userId: string;
  openingBalance: string;
  closingBalance: string | null;
  totalSales: string | null;
  totalCash: string | null;
  totalTransfer: string | null;
  totalCard: string | null;
  difference: string | null;
  differencePosnet: string | null;
  differenceMercadopago: string | null;
  differenceEnvios: string | null;
  openingPosnet: string | null;
  openingMercadopago: string | null;
  openingEnvios: string | null;
  closingPosnet: string | null;
  closingMercadopago: string | null;
  closingEnvios: string | null;
  notes: string | null;
  status: 'open' | 'closed' | 'auto_closed';
  openedAt: string;
  closedAt: string | null;
};

type Session = {
  id: number;
  openingBalance: string;
  openingPosnet: string | null;
  openingMercadopago: string | null;
  openingEnvios: string | null;
  closingBalance: string | null;
  closingPosnet: string | null;
  closingMercadopago: string | null;
  closingEnvios: string | null;
  totalSales: string | null;
  totalCash: string | null;
  totalTransfer: string | null;
  totalCard: string | null;
  difference: string | null;
  differencePosnet: string | null;
  differenceMercadopago: string | null;
  differenceEnvios: string | null;
  notes: string | null;
  status: 'open' | 'closed' | 'auto_closed';
  openedAt: string;
  closedAt: string | null;
  hasDiscrepancy?: boolean;
};

type ConsolidatedData = {
  location: { id: number; name: string };
  date: string;
  sessions: HistorySession[];
  totals: {
    totalSales: number;
    totalCash: number;
    totalCard: number;
    totalTransfer: number;
    totalDifference: number;
    totalDifferencePosnet: number;
    totalDifferenceMercadopago: number;
    totalDifferenceEnvios: number;
  };
  hasDiscrepancy: boolean;
};

type Mode = 'view' | 'opening' | 'closing' | 'closed_summary';

const fmt = (v: string | number | null) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(v ?? 0),
  );

type CajaPageProps = {
  isAdmin?: boolean;
};

export const CajaPage = ({ isAdmin = false }: CajaPageProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('view');
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingPosnet, setOpeningPosnet] = useState('');
  const [openingMercadopago, setOpeningMercadopago] = useState('');
  const [openingEnvios, setOpeningEnvios] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [closingPosnet, setClosingPosnet] = useState('');
  const [closingMercadopago, setClosingMercadopago] = useState('');
  const [closingEnvios, setClosingEnvios] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [closedSession, setClosedSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [warningAutoClose, setWarningAutoClose] = useState(false);

  // Admin consolidated view
  const [showConsolidated, setShowConsolidated] = useState(false);
  const [consolidatedDate, setConsolidatedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [consolidated, setConsolidated] = useState<ConsolidatedData | null>(null);
  const [consolidatedLoading, setConsolidatedLoading] = useState(false);

  const cancelOpening = () => {
    setMode('view');
    setError(null);
    setOpeningBalance('');
    setOpeningPosnet('');
    setOpeningMercadopago('');
    setOpeningEnvios('');
  };

  const cancelClosing = () => {
    setMode('view');
    setError(null);
    setClosingBalance('');
    setClosingPosnet('');
    setClosingMercadopago('');
    setClosingEnvios('');
  };

  const loadStatus = () => {
    fetch('/api/caja/status')
      .then(r => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSession(data.session);
          setLocationId(data.locationId);
          setWarningAutoClose(!!data.warningAutoClose);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudo cargar el estado de la caja. Recargá la página.');
        setLoading(false);
      });
  };

  const loadHistory = () => {
    setHistoryLoading(true);
    fetch('/api/caja/history?limit=20')
      .then(r => r.json())
      .then(data => setHistory(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  const loadConsolidated = () => {
    setConsolidatedLoading(true);
    fetch(`/api/caja/consolidated?date=${consolidatedDate}`)
      .then(r => r.json())
      .then(data => setConsolidated(data))
      .catch(() => {})
      .finally(() => setConsolidatedLoading(false));
  };

  useEffect(() => {
    loadStatus();
    loadHistory();
  }, []);

  const handleOpen = async () => {
    setError(null);
    setSaving(true);
    const res = await fetch('/api/caja/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openingBalance: Number(openingBalance),
        openingPosnet: openingPosnet !== '' ? Number(openingPosnet) : null,
        openingMercadopago: openingMercadopago !== '' ? Number(openingMercadopago) : null,
        openingEnvios: openingEnvios !== '' ? Number(openingEnvios) : null,
        locationId,
      }),
    });
    if (res.ok) {
      loadStatus();
      setMode('view');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? `Error ${res.status} al abrir la caja`);
    }
    setSaving(false);
  };

  const handleClose = async () => {
    if (!session) {
      return;
    }
    setError(null);
    setSaving(true);
    const res = await fetch('/api/caja/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        closingBalance: Number(closingBalance),
        closingPosnet: closingPosnet !== '' ? Number(closingPosnet) : null,
        closingMercadopago: closingMercadopago !== '' ? Number(closingMercadopago) : null,
        closingEnvios: closingEnvios !== '' ? Number(closingEnvios) : null,
        notes,
      }),
    });
    if (res.ok) {
      const closed = await res.json();
      setClosedSession(closed);
      setMode('closed_summary');
      setSession(null);
      loadHistory();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? `Error ${res.status} al cerrar la caja`);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  }

  if (error && mode === 'view' && !session) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (mode === 'closed_summary' && closedSession) {
    const hasDisc = closedSession.hasDiscrepancy;
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-lg border bg-card p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Resumen de cierre</h2>

          {hasDisc && (
            <div className="mb-4 rounded-md border border-red-500/50 bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
              Se detectaron diferencias entre el saldo esperado y el contado.
            </div>
          )}

          <div className="space-y-4 text-sm">

            {/* Ventas del día */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ventas del turno</p>
              <Row label="Total" value={fmt(closedSession.totalSales)} />
              <Row label="  · Efectivo" value={fmt(closedSession.totalCash)} />
              <Row label="  · Tarjeta (Posnet)" value={fmt(closedSession.totalCard)} />
              <Row label="  · Transferencia (MP)" value={fmt(closedSession.totalTransfer)} />
            </div>

            <hr />

            {/* Efectivo */}
            <MethodBlock
              label="Efectivo"
              opening={closedSession.openingBalance}
              closing={closedSession.closingBalance}
              difference={closedSession.difference}
            />

            {/* Posnet */}
            {closedSession.closingPosnet != null && (
              <MethodBlock
                label="Posnet"
                opening={closedSession.openingPosnet}
                closing={closedSession.closingPosnet}
                difference={closedSession.differencePosnet}
              />
            )}

            {/* MercadoPago */}
            {closedSession.closingMercadopago != null && (
              <MethodBlock
                label="MercadoPago"
                opening={closedSession.openingMercadopago}
                closing={closedSession.closingMercadopago}
                difference={closedSession.differenceMercadopago}
              />
            )}

            {/* Envíos */}
            {closedSession.closingEnvios != null && (
              <MethodBlock
                label="Plataforma de envíos"
                opening={closedSession.openingEnvios}
                closing={closedSession.closingEnvios}
                difference={closedSession.differenceEnvios}
              />
            )}
          </div>

          {closedSession.notes && (
            <p className="mt-4 text-xs text-muted-foreground">{closedSession.notes}</p>
          )}
        </div>
        <Button
          className="w-full"
          onClick={() => {
            setMode('view');
            loadStatus();
          }}
        >
          Listo
        </Button>
      </div>
    );
  }

  if (mode === 'opening') {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={cancelOpening}>← Volver</Button>
          <h2 className="text-lg font-bold">Abrir caja</h2>
        </div>
        <div className="space-y-3 rounded-lg border bg-card p-4">
          {error && (
            <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Ingresá el saldo inicial de cada medio de pago. Dejá en 0 los que no usás.
          </p>
          <div>
            <Label>Efectivo ($)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={openingBalance}
              onChange={e => setOpeningBalance(e.target.value)}
            />
          </div>
          <div>
            <Label>Posnet ($)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={openingPosnet}
              onChange={e => setOpeningPosnet(e.target.value)}
            />
          </div>
          <div>
            <Label>MercadoPago ($)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={openingMercadopago}
              onChange={e => setOpeningMercadopago(e.target.value)}
            />
          </div>
          <div>
            <Label>Plataforma de envíos ($)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={openingEnvios}
              onChange={e => setOpeningEnvios(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={openingBalance === '' || saving}
            onClick={handleOpen}
          >
            {saving ? 'Abriendo...' : 'Abrir caja'}
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'closing' && session) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={cancelClosing}>← Volver</Button>
          <h2 className="text-lg font-bold">Cerrar caja</h2>
        </div>
        <div className="space-y-3 rounded-lg border bg-card p-4">
          {error && (
            <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Contá el saldo final de cada medio de pago.
          </p>
          <div>
            <Label>Efectivo ($)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={closingBalance}
              onChange={e => setClosingBalance(e.target.value)}
            />
          </div>
          <div>
            <Label>Posnet ($)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={closingPosnet}
              onChange={e => setClosingPosnet(e.target.value)}
            />
          </div>
          <div>
            <Label>MercadoPago ($)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={closingMercadopago}
              onChange={e => setClosingMercadopago(e.target.value)}
            />
          </div>
          <div>
            <Label>Plataforma de envíos ($)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={closingEnvios}
              onChange={e => setClosingEnvios(e.target.value)}
            />
          </div>
          <div>
            <Label>Notas (opcional)</Label>
            <Input
              placeholder="Ej: Faltaron $500, entregué plata al dueño..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={closingBalance === '' || saving}
            onClick={handleClose}
          >
            {saving ? 'Cerrando...' : 'Cerrar caja'}
          </Button>
        </div>
      </div>
    );
  }

  // Default view
  return (
    <div className="space-y-6">
      {session
        ? (
            <div className="rounded-lg border bg-card p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Caja abierta</h2>
                  <p className="text-xs text-muted-foreground">
                    Abierta el
                    {' '}
                    {new Date(session.openedAt).toLocaleString('es-AR')}
                  </p>
                </div>
                <Badge variant="default">Abierta</Badge>
              </div>

              {warningAutoClose && (
                <div className="mb-4 rounded-md border border-yellow-500/50 bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                  Tu caja lleva más de 8 horas abierta. Se cerrará automáticamente a las 10 horas.
                </div>
              )}

              <p className="text-sm text-muted-foreground">Fondo inicial</p>
              <p className="text-3xl font-bold">{fmt(session.openingBalance)}</p>
              <Button
                className="mt-4"
                variant="destructive"
                onClick={() => {
                  setClosingBalance('');
                  setNotes('');
                  setMode('closing');
                }}
              >
                Cerrar caja
              </Button>
            </div>
          )
        : (
            <div className="rounded-lg border border-dashed bg-card p-8 text-center">
              <p className="mb-1 text-lg font-semibold text-muted-foreground">Caja cerrada</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Abrí la caja para comenzar a registrar ventas.
              </p>
              <Button onClick={() => {
                setOpeningBalance('');
                setMode('opening');
              }}
              >
                Abrir caja
              </Button>
            </div>
          )}

      {/* Admin: vista consolidada del día */}
      {isAdmin && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-base font-semibold">Consolidado del día</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowConsolidated(!showConsolidated);
                if (!showConsolidated && !consolidated) loadConsolidated();
              }}
            >
              {showConsolidated ? 'Ocultar' : 'Ver consolidado'}
            </Button>
          </div>

          {showConsolidated && (
            <div className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-end gap-2">
                <div>
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={consolidatedDate}
                    onChange={e => setConsolidatedDate(e.target.value)}
                  />
                </div>
                <Button size="sm" onClick={loadConsolidated} disabled={consolidatedLoading}>
                  {consolidatedLoading ? 'Cargando...' : 'Consultar'}
                </Button>
              </div>

              {consolidated && (
                <div className="space-y-3">
                  {consolidated.hasDiscrepancy && (
                    <div className="rounded-md border border-red-500/50 bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                      Se detectaron diferencias en uno o más turnos del día.
                    </div>
                  )}

                  <div className="space-y-1 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Totales del día — {consolidated.location.name}
                    </p>
                    <Row label="Ventas totales" value={fmt(consolidated.totals.totalSales)} />
                    <Row label="  · Efectivo" value={fmt(consolidated.totals.totalCash)} />
                    <Row label="  · Tarjeta" value={fmt(consolidated.totals.totalCard)} />
                    <Row label="  · Transferencia" value={fmt(consolidated.totals.totalTransfer)} />
                    <hr />
                    <DiffRow label="Diferencia efectivo" value={consolidated.totals.totalDifference} />
                    <DiffRow label="Diferencia posnet" value={consolidated.totals.totalDifferencePosnet} />
                    <DiffRow label="Diferencia MP" value={consolidated.totals.totalDifferenceMercadopago} />
                    <DiffRow label="Diferencia envíos" value={consolidated.totals.totalDifferenceEnvios} />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Turnos ({consolidated.sessions.length})
                  </p>
                  {consolidated.sessions.map(s => (
                    <div key={s.id} className="rounded border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{s.userId}</span>
                          <span className="ml-2 text-muted-foreground">
                            {new Date(s.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            {s.closedAt && (
                              <>
                                {' → '}
                                {new Date(s.closedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </>
                            )}
                          </span>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Ventas: {fmt(s.totalSales)}
                        {s.difference != null && (
                          <>
                            {' · Dif: '}
                            <span className={Number(s.difference) < 0 ? 'text-red-600' : Number(s.difference) > 0 ? 'text-green-600' : ''}>
                              {Number(s.difference) >= 0 ? '+' : ''}{fmt(s.difference)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Historial de cajas */}
      <div>
        <h3 className="mb-3 text-base font-semibold">Historial de cajas</h3>
        {historyLoading && <div className="h-20 animate-pulse rounded-lg bg-muted" />}
        {!historyLoading && history.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay cajas cerradas anteriores.</p>
        )}
        {!historyLoading && history.length > 0 && (
          <div className="space-y-2">
            {history.map(s => (
              <div key={s.id} className="rounded-lg border bg-card shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(s.openedAt).toLocaleDateString('es-AR', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                      {' '}
                      {new Date(s.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      {s.closedAt && (
                        <span className="ml-1 text-muted-foreground">
                          →
                          {' '}
                          {new Date(s.closedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ventas:
                      {' '}
                      {fmt(s.totalSales)}
                      {s.difference != null && (
                        <>
                          {' · Diferencia efectivo: '}
                          <span className={Number(s.difference ?? 0) < 0 ? 'text-red-600' : Number(s.difference ?? 0) > 0 ? 'text-green-600' : ''}>
                            {Number(s.difference ?? 0) >= 0 ? '+' : ''}
                            {fmt(s.difference)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.status} />
                    <span className="text-xs text-muted-foreground">{expandedId === s.id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {expandedId === s.id && (
                  <div className="border-t px-4 pb-4 pt-3">
                    <div className="space-y-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ventas del turno</p>
                        <Row label="Total" value={fmt(s.totalSales)} />
                        <Row label="  · Efectivo" value={fmt(s.totalCash)} />
                        <Row label="  · Tarjeta (Posnet)" value={fmt(s.totalCard)} />
                        <Row label="  · Transferencia (MP)" value={fmt(s.totalTransfer)} />
                      </div>
                      <hr />
                      <MethodBlock label="Efectivo" opening={s.openingBalance} closing={s.closingBalance} difference={s.difference} />
                      {s.closingPosnet != null && (
                        <MethodBlock label="Posnet" opening={s.openingPosnet} closing={s.closingPosnet} difference={s.differencePosnet} />
                      )}
                      {s.closingMercadopago != null && (
                        <MethodBlock label="MercadoPago" opening={s.openingMercadopago} closing={s.closingMercadopago} difference={s.differenceMercadopago} />
                      )}
                      {s.closingEnvios != null && (
                        <MethodBlock label="Plataforma de envíos" opening={s.openingEnvios} closing={s.closingEnvios} difference={s.differenceEnvios} />
                      )}
                      {s.notes && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Notas:
                          {' '}
                          {s.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function StatusBadge({ status }: { status: 'open' | 'closed' | 'auto_closed' }) {
  if (status === 'auto_closed') {
    return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Cierre automático</Badge>;
  }
  if (status === 'open') {
    return <Badge variant="default">Abierta</Badge>;
  }
  return null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function DiffRow({ label, value }: { label: string; value: number }) {
  if (Math.abs(value) < 0.01) return null;
  return (
    <div className={`flex justify-between font-bold ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
      <span>{label}</span>
      <span>{value >= 0 ? '+' : ''}{fmt(value)}</span>
    </div>
  );
}

function MethodBlock({
  label,
  opening,
  closing,
  difference,
}: {
  label: string;
  opening: string | null;
  closing: string | null;
  difference: string | null;
}) {
  const diff = Number(difference ?? 0);
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <Row label="Saldo inicial" value={fmt(opening)} />
      <Row label="Saldo contado" value={fmt(closing)} />
      <div className={`flex justify-between font-bold ${diff === 0 ? '' : diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
        <span>Diferencia</span>
        <span>
          {diff >= 0 ? '+' : ''}
          {fmt(difference)}
        </span>
      </div>
    </div>
  );
}
