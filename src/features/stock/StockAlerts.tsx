'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';

type AlertItem = {
  productId: number;
  productName: string;
  sku: string | null;
  quantity: number;
  lowStockThreshold: number;
  locationId: number;
};

export const StockAlerts = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stock/alerts')
      .then(r => r.json())
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {(['a', 'b', 'c'] as const).map(k => (
          <div key={k} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Todo el stock está dentro de los niveles normales.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {alerts.length}
        {' '}
        {alerts.length === 1 ? 'producto' : 'productos'}
        {' '}
        con stock bajo o agotado
      </p>
      {alerts.map(item => (
        <div
          key={`${item.productId}-${item.locationId}`}
          className="flex items-center justify-between rounded-lg border bg-card p-3"
        >
          <div>
            <p className="font-medium">{item.productName}</p>
            {item.sku && (
              <p className="text-xs text-muted-foreground">
                SKU:
                {' '}
                {item.sku}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              Mín:
              {' '}
              {item.lowStockThreshold}
            </span>
            <Badge variant={item.quantity === 0 ? 'destructive' : 'secondary'}>
              {item.quantity === 0 ? 'Sin stock' : `Stock: ${item.quantity}`}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};
