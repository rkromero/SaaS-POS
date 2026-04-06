'use client';

import { useCallback, useEffect, useState } from 'react';

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

import { SaleDetail } from './SaleDetail';

type Sale = {
  id: number;
  receiptNumber: string;
  customerName: string;
  paymentMethod: string;
  total: string;
  status: string;
  createdAt: string;
  locationId: number;
  locationName: string;
};

type Location = { id: number; name: string };

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  debit: 'Débito',
  credit: 'Crédito',
  transfer: 'Transferencia',
  fiado: 'Fiado',
};

export const SalesList = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedLocationId
        ? `/api/sales?locationId=${selectedLocationId}`
        : '/api/sales';
      const res = await fetch(url);
      const data = await res.json();
      setSales(data);
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then((data: any[]) => setLocations(data.filter(l => l.isActive)));
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const filtered = sales.filter(
    s =>
      search === ''
      || s.receiptNumber.toLowerCase().includes(search.toLowerCase())
      || s.customerName.toLowerCase().includes(search.toLowerCase()),
  );

  const totalAmount = filtered.reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          className="w-56"
          placeholder="Buscar por comprobante o cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          value={selectedLocationId}
          onChange={e => setSelectedLocationId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos los locales</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        {filtered.length > 0 && (
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {filtered.length}
              {' '}
              ventas
            </span>
            <span>·</span>
            <span className="font-semibold text-foreground">
              Total: $
              {totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {loading
        ? <p className="text-sm text-muted-foreground">Cargando ventas...</p>
        : filtered.length === 0
          ? (
              <p className="text-sm text-muted-foreground">
                {sales.length === 0 ? 'No hay ventas registradas aún.' : 'Sin resultados.'}
              </p>
            )
          : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm">
                        {sale.receiptNumber}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-sm">{sale.locationName}</TableCell>
                      <TableCell className="text-sm">{sale.customerName}</TableCell>
                      <TableCell className="text-sm">
                        {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        $
                        {Number(sale.total).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sale.status === 'completed' ? 'default' : 'destructive'}
                        >
                          {sale.status === 'completed' ? 'Completada' : 'Cancelada'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSaleId(sale.id)}
                        >
                          Ver ticket
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

      {selectedSaleId && (
        <SaleDetail
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
        />
      )}
    </div>
  );
};
