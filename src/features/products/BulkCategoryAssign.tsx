'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Product = {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
};

type Category = { id: number; name: string };

export function BulkCategoryAssign({ onDone }: { onDone: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [onlyUncategorized, setOnlyUncategorized] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([prods, cats]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (onlyUncategorized && p.categoryId !== null) {
        return false;
      }
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [products, onlyUncategorized, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selected);
      filtered.forEach(p => next.delete(p.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach(p => next.add(p.id));
      setSelected(next);
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleApply = async () => {
    if (selected.size === 0) {
      setError('Seleccioná al menos un producto');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/products/bulk-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: [...selected],
          categoryId: targetCategoryId ? Number(targetCategoryId) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Error al actualizar');
        return;
      }
      onDone();
    } catch {
      setError('Error de red');
    } finally {
      setSaving(false);
    }
  };

  const uncategorizedCount = products.filter(p => p.categoryId === null).length;

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">Asignar categorías en masa</h3>
          {uncategorizedCount > 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {uncategorizedCount}
              {' '}
              producto
              {uncategorizedCount !== 1 ? 's' : ''}
              {' '}
              sin categoría
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 w-52 text-sm"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyUncategorized}
            onChange={e => setOnlyUncategorized(e.target.checked)}
            className="rounded"
          />
          Solo sin categoría
        </label>
        {filtered.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="text-sm text-primary hover:underline"
          >
            {allFilteredSelected ? 'Deseleccionar todos' : `Seleccionar todos (${filtered.length})`}
          </button>
        )}
      </div>

      {/* Product list */}
      {loading
        ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
          )
        : filtered.length === 0
          ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {onlyUncategorized ? 'Todos los productos tienen categoría asignada.' : 'No hay productos.'}
              </p>
            )
          : (
              <div className="mb-4 max-h-72 overflow-y-auto rounded-lg border border-border">
                {filtered.map((product, idx) => (
                  <label
                    key={product.id}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50 ${
                      idx !== filtered.length - 1 ? 'border-b border-border' : ''
                    } ${selected.has(product.id) ? 'bg-primary/5' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleOne(product.id)}
                      className="rounded"
                    />
                    <span className="flex-1 text-sm font-medium text-foreground">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.categoryName ?? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">sin categoría</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={targetCategoryId}
          onChange={e => setTargetCategoryId(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          <option value="">— Sin categoría —</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <Button
          type="button"
          size="sm"
          onClick={handleApply}
          disabled={saving || selected.size === 0}
        >
          {saving
            ? 'Guardando...'
            : `Asignar a ${selected.size > 0 ? selected.size : '—'} producto${selected.size !== 1 ? 's' : ''}`}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
