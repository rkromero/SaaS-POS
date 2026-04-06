'use client';

import { useRef } from 'react';

import { Button } from '@/components/ui/button';

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
  createdAt: string;
};

type TicketProps = {
  sale: Sale;
  items: SaleItem[];
  locationName: string;
  orgName: string;
  onClose: () => void;
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  debit: 'Tarjeta de débito',
  credit: 'Tarjeta de crédito',
  transfer: 'Transferencia',
  fiado: 'Fiado',
};

export const Ticket = ({ sale, items, locationName, orgName, onClose }: TicketProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const date = new Date(sale.createdAt);
  const formattedDate = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const lines = [
      `🧾 *Comprobante de venta*`,
      `📍 ${orgName} — ${locationName}`,
      `📅 ${formattedDate} ${formattedTime}`,
      `Nº ${sale.receiptNumber}`,
      ``,
      `*Cliente:* ${sale.customerName}`,
      ``,
      `*Productos:*`,
      ...items.map(
        i =>
          `  • ${i.productName} x${i.quantity} = $${Number(i.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      ),
      ``,
      `*TOTAL: $${Number(sale.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}*`,
      `Pago: ${PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}`,
      ``,
      `¡Gracias por su compra! 🙌`,
    ].join('\n');

    const phone = sale.customerWhatsapp?.replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/549${phone}?text=${encodeURIComponent(lines)}`
      : `https://wa.me/?text=${encodeURIComponent(lines)}`;

    window.open(url, '_blank');
  };

  return (
    <>
      {/* Print styles — only the ticket is printed */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #ticket, #ticket * { visibility: visible; }
            #ticket {
              position: fixed;
              left: 0;
              top: 0;
              width: 80mm;
              font-size: 12px;
              font-family: monospace;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>

      <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50" />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg bg-white shadow-2xl">
          {/* Ticket content */}
          <div id="ticket" ref={ticketRef} className="p-4 font-mono text-sm">
            {/* Header */}
            <div className="mb-3 text-center">
              <div className="text-base font-bold uppercase">{orgName}</div>
              <div className="text-xs text-gray-600">{locationName}</div>
            </div>

            <div className="mb-3 border-y border-dashed border-gray-400 py-1 text-center text-xs text-gray-500">
              COMPROBANTE DE VENTA
            </div>

            {/* Sale info */}
            <div className="mb-3 space-y-0.5 text-xs">
              <div className="flex justify-between">
                <span>Comprobante:</span>
                <span className="font-semibold">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Hora:</span>
                <span>{formattedTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span>{sale.customerName}</span>
              </div>
              {sale.customerEmail && (
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span>{sale.customerEmail}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="mb-2 border-t border-dashed border-gray-400 pt-2">
              <div className="mb-1 flex justify-between text-xs font-semibold uppercase text-gray-500">
                <span>Producto</span>
                <span>Subtotal</span>
              </div>
              {items.map(item => (
                <div key={item.id} className="mb-1 text-xs">
                  <div className="flex justify-between">
                    <span className="flex-1 pr-2">{item.productName}</span>
                    <span>
                      $
                      {Number(item.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {item.quantity}
                    {' '}
                    x $
                    {Number(item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-dashed border-gray-400 pt-2">
              <div className="flex justify-between text-base font-bold">
                <span>TOTAL</span>
                <span>
                  $
                  {Number(sale.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Pago:
                {' '}
                {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
              </div>
            </div>

            <div className="mt-3 border-t border-dashed border-gray-400 pt-2 text-center text-xs text-gray-500">
              ¡Gracias por su compra!
            </div>
          </div>

          {/* Actions */}
          <div className="no-print flex flex-wrap gap-2 border-t p-3">
            <Button className="flex-1" onClick={handlePrint}>
              🖨️ Imprimir
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleWhatsApp}>
              💬 WhatsApp
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Nueva venta
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
