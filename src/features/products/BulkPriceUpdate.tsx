'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Category = { id: number; name: string };

export const BulkPriceUpdate = ({ onDone }: { onDone: () => void }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [percentage, setPercentage] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ updated: number } | null>(null);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories);
  }, []);

  const handleApply = async () => {
    if (!percentage || Number(percentage) === 0) {
      return;
    }
    setSaving(true);
    const res = await fetch('/api/products/bulk-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        percentage: Number(percentage),
        categoryId: categoryId ? Number(categoryId) : undefined,
      }),
    });
    const data = await res.json();
    setResult(data);
    setSaving(false);
  };

  if (result) {
    return (
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <p className="font-semibold text-green-700">
          ✓ Se actualizaron
          {' '}
          {result.updated}
          {' '}
          {result.updated === 1 ? 'producto' : 'productos'}
        </p>
        <Button
          onClick={() => {
            setResult(null);
            setPercentage('');
            setCategoryId('');
            onDone();
          }}
        >
          Listo
        </Button>
      </div>
    );
  }

  const pct = Number(percentage);
  const isPositive = pct > 0;

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <h3 className="font-semibold">Actualización masiva de precios</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Categoría (opcional)</Label>
          <select
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
          >
            <option value="">Todos los productos</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>
            Porcentaje de ajuste (%)
          </Label>
          <Input
            type="number"
            placeholder="Ej: 15 para +15%, -10 para -10%"
            value={percentage}
            onChange={e => setPercentage(e.target.value)}
          />
        </div>
      </div>

      {percentage !== '' && pct !== 0 && (
        <div className={`rounded-md p-3 text-sm ${isPositive ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
          {isPositive ? '⬆️' : '⬇️'}
          {' '}
          Se
          {' '}
          {isPositive ? 'subirán' : 'bajarán'}
          {' '}
          todos los precios
          {' '}
          {categoryId ? `de la categoría seleccionada` : 'activos'}
          {' '}
          un
          {' '}
          <strong>
            {Math.abs(pct)}
            %
          </strong>
          .
        </div>
      )}

      <Button
        disabled={!percentage || pct === 0 || saving}
        onClick={handleApply}
      >
        {saving ? 'Aplicando...' : 'Aplicar ajuste'}
      </Button>
    </div>
  );
};
