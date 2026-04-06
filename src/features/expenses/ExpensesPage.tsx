'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Expense = {
  id: number;
  amount: string;
  description: string;
  category: string;
  date: string;
  createdAt: string;
};

const CATEGORIES: Record<string, string> = {
  supplies: 'Insumos',
  utilities: 'Servicios',
  rent: 'Alquiler',
  salary: 'Sueldos',
  maintenance: 'Mantenimiento',
  other: 'Otros',
};

const fmt = (v: string | number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(v));

export const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('supplies');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] ?? '');

  const load = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    fetch(`/api/expenses?from=${from}`)
      .then(r => r.json())
      .then((data) => {
        setExpenses(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!amount || !description) {
      return;
    }
    setSaving(true);
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), description, category, date }),
    });
    setSaving(false);
    setShowForm(false);
    setAmount('');
    setDescription('');
    setCategory('supplies');
    load();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    load();
  };

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total del mes</p>
          <p className="text-2xl font-bold text-destructive">{fmt(total)}</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : '+ Nuevo gasto'}
        </Button>
      </div>

      {showForm && (
        <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
          <div>
            <Label>Descripción *</Label>
            <Input
              placeholder="Ej: Bolsas plásticas"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label>Monto ($) *</Label>
            <Input
              type="number"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>Categoría</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {Object.entries(CATEGORIES).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Fecha</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              disabled={!amount || !description || saving}
              onClick={handleSave}
            >
              {saving ? 'Guardando...' : 'Registrar gasto'}
            </Button>
          </div>
        </div>
      )}

      {loading
        ? (
            <div className="space-y-2">
              {(['a', 'b', 'c'] as const).map(k => (
                <div key={k} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          )
        : expenses.length === 0
          ? (
              <p className="text-sm text-muted-foreground">No hay gastos registrados este mes.</p>
            )
          : (
              <div className="space-y-2">
                {expenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div>
                      <p className="font-medium">{e.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">{CATEGORIES[e.category] ?? e.category}</Badge>
                        {new Date(e.date).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-destructive">{fmt(e.amount)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(e.id)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
    </div>
  );
};
