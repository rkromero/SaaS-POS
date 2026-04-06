'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Customer = {
  id: number;
  name: string;
  whatsapp: string | null;
  email: string | null;
  balance: string;
};

type Transaction = {
  id: number;
  type: 'charge' | 'payment';
  amount: string;
  description: string | null;
  createdAt: string;
};

type Mode = 'list' | 'history' | 'charge' | 'pay';

export const FiadoPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mode, setMode] = useState<Mode>('list');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const loadCustomers = () => {
    setLoading(true);
    fetch('/api/fiado')
      .then(r => r.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openHistory = (c: Customer) => {
    setSelected(c);
    setMode('history');
    fetch(`/api/fiado/${c.id}/transactions`)
      .then(r => r.json())
      .then(setTransactions);
  };

  const openCharge = (c: Customer) => {
    setSelected(c);
    setAmount('');
    setDescription('');
    setMode('charge');
  };

  const openPay = (c: Customer) => {
    setSelected(c);
    setAmount('');
    setDescription('');
    setMode('pay');
  };

  const handleSubmit = async () => {
    if (!selected || !amount) {
      return;
    }
    setSaving(true);
    const url = mode === 'charge'
      ? '/api/fiado'
      : `/api/fiado/${selected.id}/pay`;
    const body = mode === 'charge'
      ? { customerId: selected.id, amount: Number(amount), description }
      : { amount: Number(amount), description };

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setMode('list');
    loadCustomers();
  };

  const fmt = (v: string) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(v));

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const withDebt = filtered.filter(c => Number(c.balance) > 0);
  const noDebt = filtered.filter(c => Number(c.balance) <= 0);

  if (mode === 'charge' || mode === 'pay') {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMode('list')}>← Volver</Button>
          <h2 className="text-lg font-bold">
            {mode === 'charge' ? 'Registrar fiado' : 'Registrar pago'}
            {' '}
            —
            {' '}
            {selected?.name}
          </h2>
        </div>

        {mode === 'pay' && selected && Number(selected.balance) > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            Deuda actual:
            {' '}
            <strong>{fmt(selected.balance)}</strong>
          </div>
        )}

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div>
            <Label>Monto ($)</Label>
            <Input
              type="number"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Input
              placeholder={mode === 'charge' ? 'Ej: Alfajor + Coca' : 'Ej: Pago en efectivo'}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={!amount || Number(amount) <= 0 || saving}
            onClick={handleSubmit}
          >
            {saving
              ? 'Guardando...'
              : mode === 'charge'
                ? 'Registrar fiado'
                : 'Registrar pago'}
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'history' && selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMode('list')}>← Volver</Button>
            <h2 className="text-lg font-bold">{selected.name}</h2>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openPay(selected)}>
              Registrar pago
            </Button>
            <Button size="sm" onClick={() => openCharge(selected)}>
              + Fiado
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Saldo deudor</p>
          <p className={`text-2xl font-bold ${Number(selected.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {fmt(selected.balance)}
          </p>
        </div>

        <div className="space-y-2">
          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin movimientos.</p>
          )}
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
              <div>
                <p className="text-sm font-medium">
                  {tx.description || (tx.type === 'charge' ? 'Fiado' : 'Pago')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleString('es-AR')}
                </p>
              </div>
              <span className={`font-bold ${tx.type === 'charge' ? 'text-red-600' : 'text-green-600'}`}>
                {tx.type === 'charge' ? '+' : '-'}
                {fmt(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar cliente..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading
        ? (
            <div className="space-y-2">
              {(['a', 'b', 'c', 'd'] as const).map(k => (
                <div key={k} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          )
        : (
            <>
              {withDebt.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Con deuda</h3>
                  {withDebt.map(c => (
                    <CustomerRow
                      key={c.id}
                      customer={c}
                      fmt={fmt}
                      onHistory={() => openHistory(c)}
                      onCharge={() => openCharge(c)}
                      onPay={() => openPay(c)}
                    />
                  ))}
                </div>
              )}
              {noDebt.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Sin deuda</h3>
                  {noDebt.map(c => (
                    <CustomerRow
                      key={c.id}
                      customer={c}
                      fmt={fmt}
                      onHistory={() => openHistory(c)}
                      onCharge={() => openCharge(c)}
                      onPay={() => openPay(c)}
                    />
                  ))}
                </div>
              )}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay clientes registrados.</p>
              )}
            </>
          )}
    </div>
  );
};

function CustomerRow({
  customer,
  fmt,
  onHistory,
  onCharge,
  onPay,
}: {
  customer: Customer;
  fmt: (v: string) => string;
  onHistory: () => void;
  onCharge: () => void;
  onPay: () => void;
}) {
  const hasDebt = Number(customer.balance) > 0;
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3">
      <button type="button" className="flex items-center gap-3 text-left" onClick={onHistory}>
        <div>
          <p className="font-medium">{customer.name}</p>
          {customer.whatsapp && (
            <p className="text-xs text-muted-foreground">{customer.whatsapp}</p>
          )}
        </div>
        {hasDebt && (
          <Badge variant="destructive">{fmt(customer.balance)}</Badge>
        )}
      </button>
      <div className="flex gap-2">
        {hasDebt && (
          <Button size="sm" variant="outline" onClick={onPay}>
            Cobrar
          </Button>
        )}
        <Button size="sm" onClick={onCharge}>
          + Fiado
        </Button>
      </div>
    </div>
  );
}
