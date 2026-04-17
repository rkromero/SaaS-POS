'use client';

import { Star, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

type ReportTotals = {
  totalEarned: number;
  totalRedeemed: number;
  uniqueCustomers: number;
};

type TopCustomer = {
  customerId: number;
  customerName: string;
  customerWhatsapp: string | null;
  totalPoints: number;
  totalEarned: number;
};

type Redemption = {
  id: number;
  customerName: string;
  rewardName: string;
  pointsSpent: number;
  discountApplied: string;
  status: string;
  createdAt: string;
};

type ReportData = {
  period: { from: string; to: string };
  totals: ReportTotals;
  topCustomers: TopCustomer[];
  recentRedemptions: Redemption[];
};

export const LoyaltyReportsPage = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0]!;
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]!);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty/reports?from=${from}&to=${to}`);
      const report = await res.json();
      setData(report);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      {/* Filtros de fecha */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <label htmlFor="loyalty-report-from" className="text-xs font-medium text-muted-foreground">Desde</label>
          <input
            id="loyalty-report-from"
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="loyalty-report-to" className="text-xs font-medium text-muted-foreground">Hasta</label>
          <input
            id="loyalty-report-to"
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={loadReport}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Aplicar
        </button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando reporte...</p>}

      {!loading && data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="text-sm">Puntos emitidos</span>
              </div>
              <p className="mt-2 text-3xl font-bold">
                {Number(data.totals.totalEarned).toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-muted-foreground">en el período</p>
            </div>

            <div className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="size-4 text-green-500" />
                <span className="text-sm">Puntos canjeados</span>
              </div>
              <p className="mt-2 text-3xl font-bold">
                {Number(data.totals.totalRedeemed).toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.totals.totalEarned > 0
                  ? `${Math.round((Number(data.totals.totalRedeemed) / Number(data.totals.totalEarned)) * 100)}% del total emitido`
                  : 'sin datos'}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4 text-blue-500" />
                <span className="text-sm">Clientes activos</span>
              </div>
              <p className="mt-2 text-3xl font-bold">
                {Number(data.totals.uniqueCustomers).toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-muted-foreground">acumularon o canjearon puntos</p>
            </div>
          </div>

          {/* Top clientes */}
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-semibold">Clientes con más puntos acumulados</h2>
            {data.topCustomers.length === 0
              ? <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
              : (
                  <div className="space-y-2">
                    {data.topCustomers.map((c, i) => (
                      <div key={c.customerId} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                        <span className="w-5 shrink-0 text-center text-sm font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{c.customerName}</p>
                          {c.customerWhatsapp && (
                            <p className="text-xs text-muted-foreground">{c.customerWhatsapp}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="flex items-center gap-1 font-semibold">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            {Number(c.totalPoints).toLocaleString('es-AR')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            +
                            {Number(c.totalEarned).toLocaleString('es-AR')}
                            {' '}
                            ganados
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
          </div>

          {/* Canjes recientes */}
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-semibold">Canjes recientes</h2>
            {data.recentRedemptions.length === 0
              ? <p className="text-sm text-muted-foreground">No hubo canjes en este período.</p>
              : (
                  <div className="space-y-2">
                    {data.recentRedemptions.map(r => (
                      <div key={r.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{r.customerName}</p>
                          <p className="text-xs text-muted-foreground">{r.rewardName}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="flex items-center gap-1 text-sm font-semibold text-red-500">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            -
                            {r.pointsSpent.toLocaleString('es-AR')}
                          </p>
                          {Number(r.discountApplied) > 0 && (
                            <p className="text-xs text-green-600">
                              -$
                              {Number(r.discountApplied).toLocaleString('es-AR')}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        {r.status === 'cancelled' && (
                          <span className="shrink-0 rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                            Anulado
                          </span>
                        )}
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
