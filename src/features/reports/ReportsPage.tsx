'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Summary = {
  period: string;
  sales: {
    count: number;
    total: number;
    totalCash: number;
    totalTransfer: number;
    totalCard: number;
  };
  expenses: { total: number; count: number };
  netProfit: number;
  topProducts: { productName: string; totalQty: string; totalRevenue: string }[];
  fiado: { totalDebt: number; debtorCount: number };
};

type Period = 'today' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoy',
  week: 'Últimos 7 días',
  month: 'Este mes',
};

const fmt = (v: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);

export const ReportsPage = () => {
  const [period, setPeriod] = useState<Period>('today');
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/summary?period=${period}`)
      .then(r => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? 'default' : 'outline'}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </Button>
        ))}
      </div>

      {loading
        ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(['a', 'b', 'c', 'd'] as const).map(k => (
                <div key={k} className="h-28 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          )
        : data && (
          <>
            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard
                label="Ventas totales"
                value={fmt(data.sales.total)}
                sub={`${data.sales.count} transacciones`}
                color="green"
              />
              <KPICard
                label="Gastos"
                value={fmt(data.expenses.total)}
                sub={`${data.expenses.count} registros`}
                color="red"
              />
              <KPICard
                label="Ganancia neta"
                value={fmt(data.netProfit)}
                sub="Ventas − Gastos"
                color={data.netProfit >= 0 ? 'green' : 'red'}
              />
              <KPICard
                label="Fiado pendiente"
                value={fmt(data.fiado.totalDebt)}
                sub={`${data.fiado.debtorCount} clientes`}
                color="amber"
              />
            </div>

            {/* Payment breakdown */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-3 font-semibold">Desglose por método de pago</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <PayRow label="Efectivo" value={fmt(data.sales.totalCash)} />
                <PayRow label="Transferencia" value={fmt(data.sales.totalTransfer)} />
                <PayRow label="Tarjeta" value={fmt(data.sales.totalCard)} />
              </div>
            </div>

            {/* Top products */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-3 font-semibold">
                Top 10 productos más vendidos —
                {' '}
                {PERIOD_LABELS[period]}
              </h3>
              {data.topProducts.length === 0
                ? (
                    <p className="text-sm text-muted-foreground">Sin ventas en este período.</p>
                  )
                : (
                    <div className="space-y-2">
                      {data.topProducts.map((p, i) => (
                        <div key={p.productName} className="flex items-center gap-3">
                          <span className="w-5 text-right text-sm font-bold text-muted-foreground">
                            {i + 1}
                          </span>
                          <div className="flex flex-1 items-center justify-between">
                            <span className="text-sm font-medium">{p.productName}</span>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary">
                                x
                                {p.totalQty}
                              </Badge>
                              <span className="text-sm font-semibold">
                                {fmt(Number(p.totalRevenue))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          </>
        )}
    </div>
  );
};

function KPICard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: 'green' | 'red' | 'amber';
}) {
  const colors = {
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
  };
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function PayRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
