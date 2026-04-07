'use client';

import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductForm } from '@/features/products/ProductForm';

type FoundProduct = {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
};

type ScanEntry = {
  id: number;
  productName: string;
  qty: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  locationId: number;
  onSuccess: () => void;
};

const REASONS = [
  { value: 'purchase', label: 'Compra' },
  { value: 'return', label: 'Devolución de cliente' },
  { value: 'adjustment', label: 'Ajuste manual' },
];

/**
 * Diálogo de ingreso de stock por código de barras.
 *
 * Flujo:
 * 1. El usuario escanea un producto con la pistola (o escribe el código).
 * 2. El sistema busca por barcode o SKU en la API.
 * 3a. Encontrado → muestra nombre, stock actual y formulario de cantidad.
 * 3b. No encontrado → ofrece crear el producto nuevo con el barcode pre-cargado.
 * 4. Tras confirmar, vuelve al input para escanear el siguiente producto.
 */
export const BarcodeScannerDialog = ({ open, onClose, locationId, onSuccess }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyTime = useRef<number>(0);
  const barcodeBuffer = useRef<string>('');

  const [scanInput, setScanInput] = useState('');
  const [searching, setSearching] = useState(false);

  const [foundProduct, setFoundProduct] = useState<FoundProduct | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);

  // Formulario de movimiento inline
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('purchase');
  const [submitting, setSubmitting] = useState(false);
  const [movementError, setMovementError] = useState('');

  // Historial de la sesión de escaneo
  const [sessionLog, setSessionLog] = useState<ScanEntry[]>([]);

  const resetScan = useCallback(() => {
    setFoundProduct(null);
    setNotFoundBarcode(null);
    setScanInput('');
    setQty('1');
    setReason('purchase');
    setMovementError('');
    // Devuelve el foco al input de escaneo
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const lookupBarcode = useCallback(async (code: string) => {
    setSearching(true);
    setFoundProduct(null);
    setNotFoundBarcode(null);
    setMovementError('');

    try {
      const res = await fetch(
        `/api/products/barcode/${encodeURIComponent(code)}?locationId=${locationId}`,
      );
      if (res.ok) {
        const data: FoundProduct = await res.json();
        setFoundProduct(data);
        // Auto-foco en cantidad para que el usuario solo tipee el número
        setTimeout(() => document.getElementById('scan-qty')?.focus(), 80);
      } else if (res.status === 404) {
        setNotFoundBarcode(code);
      }
    } catch {
      setMovementError('Error de conexión al buscar el producto');
    } finally {
      setSearching(false);
    }
  }, [locationId]);

  // Detecta input de pistola lectora (chars < 80ms entre sí seguidos de Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();
    const timeDiff = now - lastKeyTime.current;
    lastKeyTime.current = now;

    if (e.key === 'Enter') {
      const code = barcodeBuffer.current || scanInput;
      barcodeBuffer.current = '';
      if (code.trim()) {
        setScanInput('');
        lookupBarcode(code.trim());
        e.preventDefault();
      }
      return;
    }

    if (e.key.length === 1) {
      // Si los chars llegan muy rápido, es la pistola acumulando el código
      barcodeBuffer.current = timeDiff < 80 ? barcodeBuffer.current + e.key : e.key;
    }
  };

  const handleMovementSubmit = async () => {
    if (!foundProduct) {
      return;
    }
    const quantity = Number(qty);
    if (!quantity || quantity <= 0) {
      setMovementError('La cantidad debe ser mayor a 0');
      return;
    }

    setSubmitting(true);
    setMovementError('');
    try {
      const res = await fetch('/api/stock/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: foundProduct.id,
          locationId,
          type: 'in',
          quantity,
          reason,
          notes: '',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMovementError(data.error ?? 'Error al registrar el movimiento');
        return;
      }

      // Agrega al log de sesión
      setSessionLog(prev =>
        [{ id: Date.now(), productName: foundProduct.name, qty: quantity }, ...prev].slice(0, 10),
      );

      onSuccess();
      resetScan();
    } catch {
      setMovementError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductCreated = () => {
    setShowProductForm(false);
    setNotFoundBarcode(null);
    onSuccess();
    resetScan();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ingreso de stock por código de barras</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* ── Input de escaneo ── */}
            <div className="space-y-1.5">
              <Label htmlFor="barcode-input">Código de barras</Label>
              <Input
                id="barcode-input"
                ref={inputRef}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escaneá o escribí el código..."
                disabled={searching || !!foundProduct || !!notFoundBarcode}
              />
              <p className="text-xs text-muted-foreground">
                Apuntá la pistola al producto y presioná el gatillo, o escribí el código y presioná Enter.
              </p>
            </div>

            {searching && (
              <p className="text-sm text-muted-foreground">Buscando producto...</p>
            )}

            {/* ── Producto encontrado ── */}
            {foundProduct && (
              <div className="space-y-3 rounded-lg border border-g200 bg-g50 p-4">
                <div>
                  <p className="font-medium text-g800">{foundProduct.name}</p>
                  <p className="text-sm text-g700">
                    Stock actual en este local:
                    {' '}
                    <strong>{foundProduct.quantity}</strong>
                  </p>
                  {foundProduct.barcode && (
                    <p className="font-mono text-xs text-muted-foreground">{foundProduct.barcode}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="scan-qty">Cantidad a ingresar</Label>
                    <Input
                      id="scan-qty"
                      type="number"
                      min="1"
                      step="1"
                      value={qty}
                      onChange={e => setQty(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleMovementSubmit()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Motivo</Label>
                    <select
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    >
                      {REASONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {movementError && (
                  <p className="text-sm text-destructive">{movementError}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleMovementSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Guardando...' : '↑ Confirmar ingreso'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={resetScan}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* ── Producto no encontrado ── */}
            {notFoundBarcode && (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="font-medium text-amber-800">Producto no encontrado</p>
                <p className="font-mono text-sm text-amber-700">{notFoundBarcode}</p>
                <p className="text-sm text-amber-700">
                  Este código no está registrado. Podés crear el producto ahora con el código ya cargado.
                </p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => setShowProductForm(true)}>
                    + Crear producto nuevo
                  </Button>
                  <Button size="sm" variant="ghost" onClick={resetScan}>
                    Ignorar
                  </Button>
                </div>
              </div>
            )}

            {/* ── Log de la sesión ── */}
            {sessionLog.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ingresados en esta sesión
                </p>
                <div className="space-y-1">
                  {sessionLog.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm"
                    >
                      <span className="truncate">{entry.productName}</span>
                      <span className="ml-3 shrink-0 font-medium text-g700">
                        +
                        {entry.qty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulario de creación de producto, pre-cargado con el barcode escaneado */}
      {showProductForm && notFoundBarcode && (
        <ProductForm
          open={showProductForm}
          onClose={() => {
            setShowProductForm(false);
            resetScan();
          }}
          onSuccess={handleProductCreated}
          isAdmin
          initialBarcode={notFoundBarcode}
        />
      )}
    </>
  );
};
