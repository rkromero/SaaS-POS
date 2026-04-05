'use client';

import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Movement = {
  id: number;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  userId: string;
  notes: string | null;
  createdAt: string;
};

const REASON_LABELS: Record<string, string> = {
  purchase: 'Compra',
  return: 'Devolución',
  adjustment: 'Ajuste manual',
  loss: 'Pérdida',
  breakage: 'Rotura',
  sale: 'Venta',
};

type StockMovementHistoryProps = {
  open: boolean;
  onClose: () => void;
  stockId: number;
  productName: string;
};

export const StockMovementHistory = ({
  open,
  onClose,
  stockId,
  productName,
}: StockMovementHistoryProps) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) {
      return;
    }
    setLoading(true);
    fetch(`/api/stock/movements?stockId=${stockId}`)
      .then(r => r.json())
      .then((data) => {
        setMovements(data);
        setLoading(false);
      });
  }, [open, stockId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Historial de movimientos —
            {' '}
            {productName}
          </DialogTitle>
        </DialogHeader>

        {loading
          ? <p className="text-sm text-muted-foreground">Cargando...</p>
          : movements.length === 0
            ? <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
            : (
                <div className="space-y-2">
                  {movements.map(m => (
                    <div
                      key={m.id}
                      className="flex items-start justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div>
                        <span
                          className={`mr-2 font-semibold ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {m.type === 'in' ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                        <span className="text-muted-foreground">
                          {REASON_LABELS[m.reason] ?? m.reason}
                        </span>
                        {m.notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{m.notes}</p>
                        )}
                      </div>
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
      </DialogContent>
    </Dialog>
  );
};
