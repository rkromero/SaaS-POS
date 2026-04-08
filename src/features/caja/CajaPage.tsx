'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Session = {
  id: number;
  openingBalance: string;
  closingBalance: string | null;
  totalSales: string | null;
  totalCash: string | null;
  totalTransfer: string | null;
  totalCard: string | null;
  difference: string | null;
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
  const [closingBalance, setClosingBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [closedSession, setClosedSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelOpening = () => {
    setMode('view');
    setError(null);
  };

  const cancelClosing = () => {
    setMode('view');
    setError(null);
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
      body: JSON.stringify({ openingBalance: Number(openingBalance), locationId }),
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
    const diff = Number(closedSession.difference ?? 0);
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-lg border bg-card p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Resumen de cierre</h2>
          <div className="space-y-2 text-sm">
            <Row label="Fondo inicial" value={fmt(closedSession.openingBalance)} />
            <Row label="Ventas totales" value={fmt(closedSession.totalSales)} />
            <Row label="  · Efectivo" value={fmt(closedSession.totalCash)} />
            <Row label="  · Transferencia" value={fmt(closedSession.totalTransfer)} />
            <Row label="  · Tarjeta" value={fmt(closedSession.totalCard)} />
            <hr />
            <Row label="Efectivo contado" value={fmt(closedSession.closingBalance)} />
            <div className={`flex justify-between font-bold ${diff === 0 ? '' : diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Diferencia</span>
              <span>
                {diff >= 0 ? '+' : ''}
                {fmt(closedSession.difference)}
              </span>
            </div>
          </div>
          {closedSession.notes && (
            <p className="mt-3 text-xs text-muted-foreground">{closedSession.notes}</p>
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
          <div>
            <Label>Fondo inicial ($)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={openingBalance}
              onChange={e => setOpeningBalance(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              El dinero que tenés en la caja antes de empezar el día.
            </p>
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
          <div>
            <Label>Efectivo contado en caja ($)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={closingBalance}
              onChange={e => setClosingBalance(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Contá el efectivo físico que tenés ahora en la caja.
            </p>
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
