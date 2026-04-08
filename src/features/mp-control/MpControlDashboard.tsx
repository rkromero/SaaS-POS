'use client';

import {
  AlertCircle,
  ArrowDownCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Link2,
  Link2Off,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type MpNotification = {
  id: number;
  mpNotificationId: string;
  topic: string;
  action: string | null;
  resourceId: string | null;
  status: string | null;
  amount: string | null;
  description: string | null;
  payerEmail: string | null;
  payerName: string | null;
  paymentMethodId: string | null;
  paymentTypeId: string | null;
  externalReference: string | null;
  createdAt: string;
};

type MpStatus = {
  isConnected: boolean;
  mpUserId?: string;
  notifications: MpNotification[];
};

function statusBadge(status: string | null) {
  if (!status) {
    return null;
  }
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    approved: { label: 'Aprobado', className: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="size-3" /> },
    pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800', icon: <Clock className="size-3" /> },
    in_process: { label: 'En proceso', className: 'bg-blue-100 text-blue-800', icon: <Clock className="size-3" /> },
    rejected: { label: 'Rechazado', className: 'bg-red-100 text-red-800', icon: <XCircle className="size-3" /> },
    refunded: { label: 'Devuelto', className: 'bg-gray-100 text-gray-700', icon: <ArrowDownCircle className="size-3" /> },
    cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700', icon: <XCircle className="size-3" /> },
    charged_back: { label: 'Contracargo', className: 'bg-red-100 text-red-800', icon: <AlertCircle className="size-3" /> },
  };
  const s = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-700', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

function topicLabel(topic: string, action: string | null) {
  if (topic === 'payment' || action?.startsWith('payment')) {
    return 'Pago';
  }
  if (topic === 'merchant_order') {
    return 'Orden';
  }
  if (topic === 'point_integration_wh') {
    return 'POS Point';
  }
  return topic;
}

function formatAmount(amount: string | null) {
  if (!amount) {
    return null;
  }
  const n = Number.parseFloat(amount);
  if (Number.isNaN(n)) {
    return amount;
  }
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function MpControlDashboard() {
  const [data, setData] = useState<MpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/mp-control');
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function handleConnect() {
    window.location.href = '/api/mp/oauth/connect';
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch('/api/mp-control', { method: 'DELETE' });
      setData(prev => prev ? { ...prev, isConnected: false, mpUserId: undefined, notifications: [] } : prev);
      setConfirmDisconnect(false);
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <RefreshCw className="mr-2 size-4 animate-spin" />
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection status card */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-full ${data?.isConnected ? 'bg-green-100' : 'bg-muted'}`}>
              {data?.isConnected
                ? <Link2 className="size-5 text-green-700" />
                : <Link2Off className="size-5 text-muted-foreground" />}
            </div>
            <div>
              <p className="font-semibold">
                {data?.isConnected ? 'Cuenta conectada' : 'Sin conexión'}
              </p>
              <p className="text-sm text-muted-foreground">
                {data?.isConnected
                  ? `MP User ID: ${data.mpUserId}`
                  : 'Conectá tu cuenta de Mercado Pago para ver cobros, depósitos y transferencias en tiempo real.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data?.isConnected
              ? (
                  <>
                    <button
                      type="button"
                      onClick={fetchStatus}
                      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                    >
                      <RefreshCw className="size-3.5" />
                      Actualizar
                    </button>
                    {confirmDisconnect
                      ? (
                          <>
                            <span className="text-xs text-red-600">¿Confirmar desconexión?</span>
                            <button
                              type="button"
                              onClick={handleDisconnect}
                              disabled={disconnecting}
                              className="rounded-md border border-red-300 bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Sí, desconectar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDisconnect(false)}
                              className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                            >
                              Cancelar
                            </button>
                          </>
                        )
                      : (
                          <button
                            type="button"
                            onClick={() => setConfirmDisconnect(true)}
                            className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Link2Off className="size-3.5" />
                            Desconectar
                          </button>
                        )}
                  </>
                )
              : (
                  <button
                    type="button"
                    onClick={handleConnect}
                    className="flex items-center gap-2 rounded-lg bg-[#009ee3] px-4 py-2 text-sm font-medium text-white hover:bg-[#008fcf]"
                  >
                    <CreditCard className="size-4" />
                    Conectar con Mercado Pago
                  </button>
                )}
          </div>
        </div>
      </div>

      {/* Notifications list */}
      {data?.isConnected && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Notificaciones recientes</h2>
              <span className="text-sm text-muted-foreground">
                {data.notifications.length}
                {' '}
                registros
              </span>
            </div>
          </div>

          {data.notifications.length === 0
            ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <DollarSign className="mb-3 size-10 opacity-30" />
                  <p className="font-medium">Sin notificaciones aún</p>
                  <p className="mt-1 text-sm">
                    Las notificaciones aparecerán aquí cuando Mercado Pago envíe eventos a tu cuenta.
                  </p>
                </div>
              )
            : (
                <div className="divide-y">
                  {data.notifications.map(n => (
                    <div key={n.id} className="flex flex-col gap-1.5 px-5 py-4 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{topicLabel(n.topic, n.action)}</span>
                          {statusBadge(n.status)}
                          {n.amount && (
                            <span className="text-sm font-semibold text-green-700">
                              {formatAmount(n.amount)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          {n.payerName && <span>{n.payerName}</span>}
                          {n.payerEmail && <span>{n.payerEmail}</span>}
                          {n.description && <span className="italic">{n.description}</span>}
                          {n.paymentMethodId && <span className="rounded bg-muted px-1">{n.paymentMethodId}</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(n.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </div>
      )}
    </div>
  );
}
