'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';

import { MetricCard } from './MetricCard';

type Metrics = {
  today: { count: number; total: number };
  month: { count: number; total: number };
  revenueByPayment: { paymentMethod: string; total: number; count: number }[];
  topProducts: { productName: string; totalQty: number; totalRevenue: number }[];
  lowStock: { productName: string; locationName: string; quantity: number; threshold: number }[];
  salesTrend: { date: string; total: number; count: number }[];
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  debit: 'Débito',
  credit: 'Crédito',
  transfer: 'Transferencia',
};

const fmt = (n: number) =>
  `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export const DashboardMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/metrics')
      .then(r => r.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Build 7-day trend chart (simple bar)
  const maxTrend = Math.max(...metrics.salesTrend.map(d => Number(d.total)), 1);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          title="Ventas hoy"
          value={fmt(metrics.today.total)}
          subtitle={`${metrics.today.count} transacciones`}
          highlight
        />
        <MetricCard
          title="Ventas este mes"
          value={fmt(metrics.month.total)}
          subtitle={`${metrics.month.count} transacciones`}
        />
        <MetricCard
          title="Ticket promedio (mes)"
          value={metrics.month.count > 0
            ? fmt(metrics.month.total / metrics.month.count)
            : '$0'}
          subtitle="Promedio por venta"
        />
        <MetricCard
          title="Alertas de stock"
          value={String(metrics.lowStock.length)}
          subtitle={metrics.lowStock.length > 0 ? 'Productos bajo umbral' : 'Todo en orden'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales trend last 7 days */}
        <div className="col-span-2 rounded-lg border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Ventas últimos 7 días</h3>
          {metrics.salesTrend.length === 0
            ? <p className="text-sm text-muted-foreground">Sin ventas en este período.</p>
            : (
                <div className="flex h-32 items-end gap-1.5">
                  {metrics.salesTrend.map(day => (
                    <div key={day.date} className="group relative flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-primary transition-all group-hover:opacity-80"
                        style={{ height: `${(Number(day.total) / maxTrend) * 100}%`, minHeight: '4px' }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute -top-8 hidden rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                        {fmt(day.total)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </div>

        {/* Revenue by payment method */}
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Por método de pago (mes)</h3>
          {metrics.revenueByPayment.length === 0
            ? <p className="text-sm text-muted-foreground">Sin datos.</p>
            : (
                <div className="space-y-2">
                  {metrics.revenueByPayment.map(pm => (
                    <div key={pm.paymentMethod} className="flex items-center justify-between">
                      <span className="text-sm">
                        {PAYMENT_LABELS[pm.paymentMethod] ?? pm.paymentMethod}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{fmt(pm.total)}</div>
                        <div className="text-xs text-muted-foreground">
                          {pm.count}
                          {' '}
                          ventas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </div>

        {/* Top products */}
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Productos más vendidos (mes)</h3>
          {metrics.topProducts.length === 0
            ? <p className="text-sm text-muted-foreground">Sin ventas este mes.</p>
            : (
                <div className="space-y-2">
                  {metrics.topProducts.map((p, i) => (
                    <div key={p.productName} className="flex items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1 truncate text-sm">{p.productName}</div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-semibold">
                          {p.totalQty}
                          {' '}
                          uds.
                        </div>
                        <div className="text-xs text-muted-foreground">{fmt(p.totalRevenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </div>

        {/* Low stock alerts */}
        <div className="col-span-1 rounded-lg border bg-card p-5 shadow-sm md:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">⚠️ Stock bajo</h3>
          {metrics.lowStock.length === 0
            ? <p className="text-sm text-muted-foreground">No hay alertas de stock.</p>
            : (
                <div className="space-y-2">
                  {metrics.lowStock.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-red-50 px-3 py-1.5">
                      <div>
                        <span className="text-sm font-medium">{s.productName}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{s.locationName}</span>
                      </div>
                      <Badge variant="destructive">
                        {s.quantity}
                        {' '}
                        ud.
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>
    </div>
  );
};
