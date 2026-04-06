'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type SaleItem = {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
};

type Sale = {
  id: number;
  receiptNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerWhatsapp: string | null;
  paymentMethod: string;
  total: string;
  status: string;
  createdAt: string;
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  debit: 'Tarjeta de débito',
  credit: 'Tarjeta de crédito',
  transfer: 'Transferencia',
};

export const SaleDetail = ({
  saleId,
  onClose,
}: {
  saleId: number;
  onClose: () => void;
}) => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sales/${saleId}`)
      .then(r => r.json())
      .then((data) => {
        setSale(data.sale);
        setItems(data.items);
        setLoading(false);
      });
  }, [saleId]);

  const handlePrint = () => window.print();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Comprobante
            {' '}
            {sale?.receiptNumber}
          </DialogTitle>
        </DialogHeader>

        {loading
          ? <p className="text-sm text-muted-foreground">Cargando...</p>
          : sale && (
            <div id="ticket" className="space-y-4 font-mono text-sm">
              {/* Sale info */}
              <div className="space-y-1 rounded-md bg-muted p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha</span>
                  <span>
                    {new Date(sale.createdAt).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span>{sale.customerName}</span>
                </div>
                {sale.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{sale.customerEmail}</span>
                  </div>
                )}
                {sale.customerWhatsapp && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <span>{sale.customerWhatsapp}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pago</span>
                  <span>{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <div>
                      <span>{item.productName}</span>
                      <span className="ml-2 text-muted-foreground">
                        {item.quantity}
                        {' '}
                        x $
                        {Number(item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span className="font-medium">
                      $
                      {Number(item.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>TOTAL</span>
                <span>
                  $
                  {Number(sale.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={handlePrint}>
                  🖨️ Imprimir
                </Button>
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
};
