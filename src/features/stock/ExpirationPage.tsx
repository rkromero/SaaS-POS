'use client';

import { AlertTriangle, Calendar, Clock, Package, RefreshCw, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { ExpirationAlertConfig } from './ExpirationAlertConfig';

type Batch = {
  batchId: number;
  batchNumber: string | null;
  batchQuantity: number;
  expirationDate: string | null;
  batchNotes: string | null;
  productId: number;
  productName: string;
  productSku: string | null;
  locationId: number;
  locationName: string;
  daysUntilExpiration: number | null;
  isExpired: boolean;
};

type Threshold = {
  id: number;
  thresholdDays: number;
  emailEnabled: boolean;
  inAppEnabled: boolean;
};

type ExpirationData = {
  batches: Batch[];
  lookAheadDays: number;
  thresholds: Threshold[];
};

type StatusFilter = 'expiring' | 'expired' | 'all';

function urgencyBadge(days: number | null, isExpired: boolean) {
  if (isExpired) {
    return <Badge variant="destructive">Vencido</Badge>;
  }
  if (days == null) {
    return null;
  }
  if (days <= 7) {
    return (
      <Badge variant="destructive">
        {days}
        d
      </Badge>
    );
  }
  if (days <= 15) {
    return (
      <Badge className="bg-orange-500 text-white hover:bg-orange-600">
        {days}
        d
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      {days}
      d
    </Badge>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) {
    return '—';
  }
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ExpirationPage() {
  const [data, setData] = useState<ExpirationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('expiring');
  const [showConfig, setShowConfig] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/stock/expiration?status=${statusFilter}`);
      const text = await res.text();
      let json: ExpirationData | { error: string };
      try {
        json = JSON.parse(text) as ExpirationData | { error: string };
      } catch {
        setError(`Error del servidor: ${text.slice(0, 200)}`);
        return;
      }
      if (!res.ok) {
        setError((json as { error: string }).error ?? 'Error al cargar');
        return;
      }
      setData(json as ExpirationData);
    } catch (e) {
      setError(`Error de conexión: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const expiredCount = data?.batches.filter(b => b.isExpired).length ?? 0;
  const expiringCount = data?.batches.filter(b => !b.isExpired).length ?? 0;

  return (
    <div className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            <span className="text-sm font-medium">Vencidos</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{loading ? '—' : expiredCount}</p>
          <p className="text-xs text-muted-foreground">lotes en stock</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-orange-500">
            <Clock className="size-4" />
            <span className="text-sm font-medium">Por vencer</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{loading ? '—' : expiringCount}</p>
          <p className="text-xs text-muted-foreground">
            próximos
            {' '}
            {data?.lookAheadDays ?? 30}
            {' '}
            días
            {(data?.thresholds.length ?? 0) === 0 && ' (configurá umbrales)'}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border bg-card p-4 sm:col-span-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4" />
            <span className="text-sm font-medium">Umbrales activos</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{data?.thresholds.length ?? '—'}</p>
          <p className="text-xs text-muted-foreground">
            {(data?.thresholds.length ?? 0) === 0
              ? 'Sin configurar'
              : data?.thresholds.map(t => `${t.thresholdDays}d`).join(', ')}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="flex h-9 w-44 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="expiring">
            Por vencer (próx.
            {data?.lookAheadDays ?? 30}
            d)
          </option>
          <option value="expired">Vencidos</option>
          <option value="all">Todos los lotes</option>
        </select>

        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfig(s => !s)}
        >
          <Settings className="mr-2 size-4" />
          Configurar alertas
        </Button>
      </div>

      {/* Alert config panel */}
      {showConfig && (
        <ExpirationAlertConfig
          initialThresholds={data?.thresholds ?? []}
          onSaved={(saved) => {
            setData(prev => prev ? { ...prev, thresholds: saved } : null);
            setShowConfig(false);
          }}
        />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Producto</th>
                <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Local</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Lote</th>
                <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                <th className="px-4 py-3 text-left font-medium">Vencimiento</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && (data?.batches.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <Package className="mx-auto mb-2 size-8 opacity-30" />
                    No hay lotes en este estado.
                  </td>
                </tr>
              )}
              {!loading && data?.batches.map(batch => (
                <tr
                  key={batch.batchId}
                  className={`border-b transition-colors last:border-0 hover:bg-muted/30 ${
                    batch.isExpired ? 'bg-destructive/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{batch.productName}</p>
                    {batch.productSku && (
                      <p className="text-xs text-muted-foreground">{batch.productSku}</p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {batch.locationName}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {batch.batchNumber ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {batch.batchQuantity}
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(batch.expirationDate)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {urgencyBadge(batch.daysUntilExpiration, batch.isExpired)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
