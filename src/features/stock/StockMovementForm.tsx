'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type StockMovementFormProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: number;
  productName: string;
  locationId: number;
  currentQuantity: number;
  type: 'in' | 'out';
};

const IN_REASONS = [
  { value: 'purchase', label: 'Compra' },
  { value: 'return', label: 'Devolución de cliente' },
  { value: 'adjustment', label: 'Ajuste manual' },
];

const OUT_REASONS = [
  { value: 'loss', label: 'Pérdida' },
  { value: 'breakage', label: 'Rotura' },
  { value: 'adjustment', label: 'Ajuste manual' },
];

export const StockMovementForm = ({
  open,
  onClose,
  onSuccess,
  productId,
  productName,
  locationId,
  currentQuantity,
  type,
}: StockMovementFormProps) => {
  const reasons = type === 'in' ? IN_REASONS : OUT_REASONS;
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(reasons[0]!.value);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stock/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, locationId, type, quantity: qty, reason, notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Error al guardar');
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'in' ? '↑ Ingreso de stock' : '↓ Egreso de stock'}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-2 rounded-md bg-muted px-3 py-2 text-sm">
          <span className="font-medium">{productName}</span>
          <span className="ml-2 text-muted-foreground">
            Stock actual:
            {' '}
            <strong>{currentQuantity}</strong>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Cantidad *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Motivo *</Label>
            <select
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              {reasons.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones opcionales..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant={type === 'out' ? 'destructive' : 'default'}
            >
              {loading
                ? 'Guardando...'
                : type === 'in'
                  ? 'Registrar ingreso'
                  : 'Registrar egreso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
