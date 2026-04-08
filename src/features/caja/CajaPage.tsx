'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  status: 'open' | 'closed';
  openedAt: string;
  closedAt: string | null;
};

type Mode = 'view' | 'opening' | 'closing' | 'closed_summary';

const fmt = (v: string | null) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(v ?? 0),
  );

export const CajaPage = () => {
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
        setSession(data.session);
        setLocationId(data.locationId);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadStatus();
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
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? `Error ${res.status} al cerrar la caja`);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  }

  if (mode === 'closed_summary' && closedSession) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-lg border bg-card p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Resumen de cierre</h2>
          <div className="space-y-4 text-sm">

            {/* Ventas del día */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ventas del día</p>
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
    <div className="space-y-4">
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
    </div>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
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
