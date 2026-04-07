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

type Location = { id: number; name: string };

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

type ExpensesPageProps = {
  isAdmin?: boolean;
};

export const ExpensesPage = ({ isAdmin }: ExpensesPageProps) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('supplies');
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [date, setDate] = useState(localDate);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    fetch('/api/locations')
      .then(r => r.json())
      .then((data: Location[]) => {
        const active = data.filter((l: any) => l.isActive);
        setLocations(active);
        if (active.length > 0) {
          setSelectedLocationId(active[0]!.id);
        }
      });
  }, [isAdmin]);

  const load = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const locationParam = isAdmin && selectedLocationId ? `&locationId=${selectedLocationId}` : '';
    fetch(`/api/expenses?from=${from}${locationParam}`)
      .then(r => r.json())
      .then((data) => {
        setExpenses(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isAdmin && locations.length > 0 && !selectedLocationId) {
      return;
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId, isAdmin, locations.length]);

  const handleSave = async () => {
    if (!amount || !description) {
      return;
    }
    setSaving(true);
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        description,
        category,
        date,
        ...(isAdmin && selectedLocationId ? { locationId: selectedLocationId } : {}),
      }),
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

  const selectedLocationName = locations.find(l => l.id === selectedLocationId)?.name;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Total del mes</p>
          <p className="text-2xl font-bold text-destructive">{fmt(total)}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && locations.length > 1 && (
            <select
              value={selectedLocationId ?? ''}
              onChange={e => setSelectedLocationId(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          )}
          <Button onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancelar' : '+ Nuevo gasto'}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
          {isAdmin && selectedLocationName && (
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Local:</span>
                {locations.length > 1
                  ? (
                      <select
                        value={selectedLocationId ?? ''}
                        onChange={e => setSelectedLocationId(Number(e.target.value))}
                        className="h-7 rounded border border-input bg-background px-2 text-xs"
                      >
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    )
                  : <span className="font-medium">{selectedLocationName}</span>}
              </div>
            </div>
          )}
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
