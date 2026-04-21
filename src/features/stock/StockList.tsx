'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { BarcodeScannerDialog } from './BarcodeScannerDialog';
import { StockMovementForm } from './StockMovementForm';
import { StockMovementHistory } from './StockMovementHistory';

type StockItem = {
  id: number | null; // null when no stock record exists yet
  quantity: number;
  lowStockThreshold: number;
  productId: number;
  productName: string;
  productSku: string | null;
  productBarcode: string | null;
  productIsActive: boolean;
  categoryName: string | null;
  locationId: number;
};

type Location = { id: number; name: string };

type StockListProps = {
  isAdmin?: boolean;
  hasExpirationModule?: boolean;
};

export const StockList = ({ isAdmin, hasExpirationModule = false }: StockListProps) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal state
  const [movementModal, setMovementModal] = useState<{
    open: boolean;
    type: 'in' | 'out';
    item: StockItem | null;
    locationId: number | null;
  }>({ open: false, type: 'in', item: null, locationId: null });

  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    item: StockItem | null;
  }>({ open: false, item: null });

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanNotFound, setScanNotFound] = useState<string | null>(null);

  // Detección de pistola lectora global (sin necesidad de abrir el scanner dialog)
  const lastKeyTime = useRef<number>(0);
  const barcodeBuffer = useRef<string>('');

  // Load locations on mount
  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then((data: Location[]) => {
        const active = data.filter((l: any) => l.isActive);
        setLocations(active);
        if (active.length > 0) {
          setSelectedLocationId(String(active[0]!.id));
        }
      });
  }, []);

  const fetchStock = useCallback(async () => {
    if (!selectedLocationId) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/stock?locationId=${selectedLocationId}`);
      const data = await res.json();
      setStock(data);
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const openMovement = (item: StockItem, type: 'in' | 'out') => {
    setMovementModal({ open: true, type, item, locationId: item.locationId });
  };

  const openHistory = (item: StockItem) => {
    setHistoryModal({ open: true, item });
  };

  // Escáner global: detecta pistola lectora por velocidad de teclas (< 80ms entre chars + Enter)
  // Solo actúa cuando no hay ningún modal abierto y hay un local seleccionado
  useEffect(() => {
    if (!selectedLocationId) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // No interferir si hay un modal abierto o si el foco está en un input del usuario
      const anyModalOpen = movementModal.open || historyModal.open || scannerOpen;
      if (anyModalOpen) {
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTime.current;
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        const code = barcodeBuffer.current.trim();
        barcodeBuffer.current = '';
        if (code.length < 3) {
          return;
        }

        e.preventDefault();
        setScanNotFound(null);

        fetch(`/api/products/barcode/${encodeURIComponent(code)}?locationId=${selectedLocationId}`)
          .then(r => r.ok ? r.json() : null)
          .then((product: { id: number; name: string; sku: string | null; barcode: string | null; quantity: number } | null) => {
            if (!product) {
              setScanNotFound(code);
              return;
            }
            // Buscar en el stock ya cargado; si no existe, construir un ítem mínimo
            const stockItem = stock.find(s => s.productId === product.id) ?? {
              id: null,
              quantity: product.quantity,
              lowStockThreshold: 0,
              productId: product.id,
              productName: product.name,
              productSku: product.sku,
              productBarcode: product.barcode,
              productIsActive: true,
              categoryName: null,
              locationId: Number(selectedLocationId),
            };
            openMovement(stockItem, 'in');
          })
          .catch(() => setScanNotFound(code));
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer.current = diff < 80 ? barcodeBuffer.current + e.key : e.key;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedLocationId, movementModal.open, historyModal.open, scannerOpen, stock]);

  const filtered = stock.filter(
    item =>
      search === ''
      || item.productName.toLowerCase().includes(search.toLowerCase())
      || (item.productSku ?? '').toLowerCase().includes(search.toLowerCase())
      || (item.productBarcode ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const lowStockCount = stock.filter(s => s.quantity <= s.lowStockThreshold).length;

  return (
    <div className="space-y-4">
      {/* Location selector + search */}
      <div className="flex flex-wrap items-center gap-3">
        {locations.length > 1 && (
          <select
            value={selectedLocationId}
            onChange={e => setSelectedLocationId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        )}

        <Input
          className="w-56"
          placeholder="Buscar producto, SKU o barcode..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {selectedLocationId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScannerOpen(true)}
          >
            📷 Escanear producto
          </Button>
        )}

        {lowStockCount > 0 && (
          <Badge variant="destructive">
            ⚠️
            {' '}
            {lowStockCount}
            {' '}
            producto
            {lowStockCount !== 1 ? 's' : ''}
            {' '}
            con stock bajo
          </Badge>
        )}

        {scanNotFound && (
          <Badge variant="outline" className="border-orange-300 text-orange-600">
            Código
            {' '}
            <span className="font-mono">{scanNotFound}</span>
            {' '}
            no encontrado
          </Badge>
        )}
      </div>

      {locations.length === 0
        ? (
            <p className="text-sm text-muted-foreground">
              No hay locales activos. Creá un local primero en la sección Locales.
            </p>
          )
        : loading
          ? <p className="text-sm text-muted-foreground">Cargando stock...</p>
          : filtered.length === 0
            ? (
                <p className="text-sm text-muted-foreground">
                  {stock.length === 0
                    ? 'No hay stock registrado en este local. Registrá el primer ingreso desde Productos.'
                    : 'Sin resultados para la búsqueda.'}
                </p>
              )
            : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-center">Stock actual</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => {
                      const isLow = item.quantity <= item.lowStockThreshold;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.productName}</div>
                            {item.productSku && (
                              <div className="text-xs text-muted-foreground">{item.productSku}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.categoryName ?? '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                                isLow
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {isLow && '⚠️'}
                              {item.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="space-x-1 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openMovement(item, 'in')}
                            >
                              ↑ Ingreso
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openMovement(item, 'out')}
                            >
                              ↓ Egreso
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={item.id === null}
                              onClick={() => item.id !== null && openHistory(item)}
                            >
                              Historial
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

      {/* Stock movement form */}
      {movementModal.open && movementModal.item && (
        <StockMovementForm
          open={movementModal.open}
          onClose={() => setMovementModal({ open: false, type: 'in', item: null, locationId: null })}
          onSuccess={fetchStock}
          productId={movementModal.item.productId}
          productName={movementModal.item.productName}
          locationId={movementModal.locationId ?? movementModal.item.locationId}
          locationName={locations.find(l => l.id === (movementModal.locationId ?? movementModal.item!.locationId))?.name ?? ''}
          locations={isAdmin ? locations : undefined}
          currentQuantity={movementModal.item.quantity}
          type={movementModal.type}
          onLocationChange={newId => setMovementModal(prev => ({ ...prev, locationId: newId }))}
          hasExpirationModule={hasExpirationModule}
        />
      )}

      {/* Movement history modal */}
      {historyModal.open && historyModal.item && (
        <StockMovementHistory
          open={historyModal.open}
          onClose={() => setHistoryModal({ open: false, item: null })}
          stockId={historyModal.item.id!}
          productName={historyModal.item.productName}
        />
      )}

      {/* Barcode scanner dialog */}
      {scannerOpen && selectedLocationId && (
        <BarcodeScannerDialog
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          locationId={Number(selectedLocationId)}
          onSuccess={fetchStock}
        />
      )}
    </div>
  );
};
