'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Supplier = { id: number; name: string };
type Location = { id: number; name: string };
type StockAlert = { productId: number; productName: string; quantity: number; lowStockThreshold: number };
type OrderItem = { productId: number; productName: string; quantity: number; unitCost: string };
type Order = {
  id: number;
  supplierName: string;
  status: 'pending' | 'received' | 'cancelled';
  notes: string | null;
  createdAt: string;
  receivedAt: string | null;
};

const statusLabel: Record<Order['status'], string> = {
  pending: 'Pendiente',
  received: 'Recibido',
  cancelled: 'Cancelado',
};
const statusVariant: Record<Order['status'], 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary',
  received: 'default',
  cancelled: 'destructive',
};

type Mode = 'list' | 'new' | 'detail';

export const PurchaseOrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('list');
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [supplierId, setSupplierId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      fetch('/api/purchase-orders').then(r => r.json()),
      fetch('/api/suppliers').then(r => r.json()),
      fetch('/api/locations').then(r => r.json()),
      fetch('/api/stock/alerts').then(r => r.json()),
    ]).then(([o, s, l, a]) => {
      setOrders(o);
      setSuppliers(s.filter((x: Supplier & { isActive: boolean }) => x.isActive));
      setLocations(l);
      setAlerts(a);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setSupplierId('');
    setLocationId('');
    setNotes('');
    setItems([]);
    setMode('new');
  };

  // Pre-fill items from low-stock alerts for the selected location
  const prefillFromAlerts = () => {
    const newItems = alerts
      .filter(a => !items.some(i => i.productId === a.productId))
      .map(a => ({
        productId: a.productId,
        productName: a.productName,
        quantity: Math.max(1, a.lowStockThreshold - a.quantity + 5), // order up to threshold + buffer
        unitCost: '',
      }));
    setItems(prev => [...prev, ...newItems]);
  };

  const updateItemQty = (idx: number, qty: number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!supplierId || !locationId) {
      return;
    }
    setSaving(true);
    await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierId: Number(supplierId),
        locationId: Number(locationId),
        notes,
        items: items.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitCost: i.unitCost ? Number(i.unitCost) : undefined,
        })),
      }),
    });
    setSaving(false);
    setMode('list');
    load();
  };

  const openDetail = async (order: Order) => {
    const res = await fetch(`/api/purchase-orders/${order.id}`);
    const data = await res.json();
    setSelectedOrder(data);
    setMode('detail');
  };

  const handleReceive = async () => {
    if (!selectedOrder) {
      return;
    }
    setSaving(true);
    await fetch(`/api/purchase-orders/${selectedOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'receive' }),
    });
    setSaving(false);
    setMode('list');
    load();
  };

  const handleCancel = async () => {
    if (!selectedOrder) {
      return;
    }
    setSaving(true);
    await fetch(`/api/purchase-orders/${selectedOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    setSaving(false);
    setMode('list');
    load();
  };

  if (mode === 'detail' && selectedOrder) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMode('list')}>← Volver</Button>
          <h3 className="font-semibold">
            Pedido #
            {selectedOrder.id}
            {' '}
            —
            {' '}
            {selectedOrder.supplierName}
          </h3>
          <Badge variant={statusVariant[selectedOrder.status]}>
            {statusLabel[selectedOrder.status]}
          </Badge>
        </div>

        <div className="space-y-2">
          {selectedOrder.items.map(item => (
            <div key={`${item.productId}-${item.productName}`} className="flex justify-between rounded-lg border bg-card p-3 text-sm">
              <span>{item.productName}</span>
              <span className="font-medium">
                x
                {item.quantity}
              </span>
            </div>
          ))}
          {selectedOrder.items.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin ítems registrados.</p>
          )}
        </div>

        {selectedOrder.notes && (
          <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
        )}

        {selectedOrder.status === 'pending' && (
          <div className="flex gap-2">
            <Button onClick={handleReceive} disabled={saving}>
              {saving ? 'Procesando...' : 'Marcar como recibido'}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={saving}>
              Cancelar pedido
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'new') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMode('list')}>← Volver</Button>
          <h3 className="font-semibold">Nuevo pedido</h3>
        </div>

        <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
          <div>
            <Label>Proveedor *</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
            >
              <option value="">Seleccioná un proveedor</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Local *</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
            >
              <option value="">Seleccioná un local</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>Notas (opcional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Pedido urgente" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Ítems del pedido</h4>
            {alerts.length > 0 && (
              <Button size="sm" variant="outline" onClick={prefillFromAlerts}>
                Agregar productos con stock bajo (
                {alerts.length}
                )
              </Button>
            )}
          </div>
          {items.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className="flex items-center gap-2 rounded-lg border bg-card p-2">
              <span className="flex-1 text-sm">{item.productName}</span>
              <Input
                type="number"
                min="1"
                className="w-20"
                value={item.quantity}
                onChange={e => updateItemQty(idx, Number(e.target.value))}
              />
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeItem(idx)}>✕</Button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground">Usá el botón de arriba para agregar productos con stock bajo, o agregá ítems manualmente después.</p>
          )}
        </div>

        <Button
          disabled={!supplierId || !locationId || saving}
          onClick={handleCreate}
        >
          {saving ? 'Creando...' : 'Crear pedido'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Pedidos a proveedores</h3>
        <Button size="sm" onClick={openNew}>+ Nuevo pedido</Button>
      </div>

      {loading
        ? <div className="space-y-2">{(['a', 'b', 'c'] as const).map(k => <div key={k} className="h-14 animate-pulse rounded-lg bg-muted" />)}</div>
        : orders.length === 0
          ? <p className="text-sm text-muted-foreground">No hay pedidos. Creá el primero.</p>
          : (
              <div className="space-y-2">
                {orders.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border bg-card p-3 text-left hover:bg-muted/50"
                    onClick={() => openDetail(o)}
                  >
                    <div>
                      <p className="font-medium">
                        #
                        {o.id}
                        {' '}
                        —
                        {' '}
                        {o.supplierName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString('es-AR')}
                        {o.notes && ` · ${o.notes}`}
                      </p>
                    </div>
                    <Badge variant={statusVariant[o.status]}>{statusLabel[o.status]}</Badge>
                  </button>
                ))}
              </div>
            )}
    </div>
  );
};
