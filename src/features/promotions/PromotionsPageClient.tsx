'use client';

import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { PromotionForm } from './PromotionForm';

type ComboItem = { id: number; productId: number; productName: string; quantity: number };

type Promotion = {
  id: number;
  name: string;
  description: string | null;
  type: 'product_price' | 'discount' | 'combo';
  isActive: boolean;
  isStackable: boolean;
  startsAt: string | null;
  endsAt: string | null;
  targetProductId: number | null;
  targetProductName: string | null;
  promoPrice: string | null;
  discountType: 'percent' | 'fixed' | null;
  discountValue: string | null;
  discountScope: 'product' | 'category' | 'total' | null;
  targetCategoryId: number | null;
  targetCategoryName: string | null;
  comboPrice: string | null;
  comboItems: ComboItem[];
};

const TYPE_LABELS: Record<string, string> = {
  product_price: 'Precio especial',
  discount: 'Descuento',
  combo: 'Combo',
};

const TYPE_COLORS: Record<string, string> = {
  product_price: 'bg-sky-900 text-sky-300',
  discount: 'bg-amber-900 text-amber-300',
  combo: 'bg-violet-900 text-violet-300',
};

function formatDate(d: string | null) {
  if (!d) {
    return null;
  }
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function PromotionSummary({ promo }: { promo: Promotion }) {
  if (promo.type === 'product_price') {
    return (
      <span className="text-sm text-zinc-400">
        {promo.targetProductName ?? '—'}
        {' → '}
        <span className="font-medium text-zinc-200">
          $
          {Number(promo.promoPrice).toLocaleString('es-AR')}
        </span>
      </span>
    );
  }
  if (promo.type === 'discount') {
    const val = promo.discountType === 'percent'
      ? `${promo.discountValue}%`
      : `$${Number(promo.discountValue).toLocaleString('es-AR')}`;
    const scope = promo.discountScope === 'total'
      ? 'sobre el total'
      : promo.discountScope === 'product'
        ? `sobre "${promo.targetProductName}"`
        : `en categoría "${promo.targetCategoryName}"`;
    return (
      <span className="text-sm text-zinc-400">
        {val}
        {' '}
        {scope}
      </span>
    );
  }
  if (promo.type === 'combo') {
    const itemsList = promo.comboItems.map(i => `${i.quantity}x ${i.productName}`).join(' + ');
    return (
      <span className="text-sm text-zinc-400">
        {itemsList}
        {' → '}
        <span className="font-medium text-zinc-200">
          $
          {Number(promo.comboPrice).toLocaleString('es-AR')}
        </span>
      </span>
    );
  }
  return null;
}

function buildFormInitial(promo: Promotion) {
  return {
    id: promo.id,
    name: promo.name,
    description: promo.description ?? '',
    type: promo.type,
    isActive: promo.isActive,
    isStackable: promo.isStackable,
    startsAt: promo.startsAt ? promo.startsAt.slice(0, 16) : '',
    endsAt: promo.endsAt ? promo.endsAt.slice(0, 16) : '',
    targetProductId: promo.targetProductId ? String(promo.targetProductId) : '',
    promoPrice: promo.promoPrice ?? '',
    discountType: (promo.discountType ?? 'percent') as 'percent' | 'fixed',
    discountValue: promo.discountValue ?? '',
    discountScope: (promo.discountScope ?? 'total') as 'product' | 'category' | 'total',
    discountTargetProductId: promo.discountScope === 'product' && promo.targetProductId
      ? String(promo.targetProductId)
      : '',
    targetCategoryId: promo.targetCategoryId ? String(promo.targetCategoryId) : '',
    comboPrice: promo.comboPrice ?? '',
    comboItems: promo.comboItems.length >= 2
      ? promo.comboItems.map((i, idx) => ({ _key: i.id ?? idx, productId: i.productId, quantity: i.quantity }))
      : [{ _key: 1, productId: 0, quantity: 1 }, { _key: 2, productId: 0, quantity: 1 }],
  };
}

export const PromotionsPageClient = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const reload = () => {
    setLoading(true);
    fetch('/api/promotions')
      .then(r => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPromotions(data);
        }
      })
      .catch(() => setError('Error al cargar las promociones'))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  const handleDelete = async (id: number) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    setDeleting(id);
    const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPromotions(prev => prev.filter(p => p.id !== id));
    }
    setDeleting(null);
  };

  const handleToggleActive = async (promo: Promotion) => {
    const res = await fetch(`/api/promotions/${promo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...buildFormInitial(promo),
        isActive: !promo.isActive,
      }),
    });
    if (res.ok) {
      setPromotions(prev =>
        prev.map(p => p.id === promo.id ? { ...p, isActive: !p.isActive } : p),
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (showForm || editing) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-5 text-base font-semibold text-zinc-200">
          {editing ? 'Editar promoción' : 'Nueva promoción'}
        </h2>
        <PromotionForm
          initial={editing ? buildFormInitial(editing) : undefined}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            reload();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {promotions.length}
          {' '}
          promoción
          {promotions.length !== 1 ? 'es' : ''}
          {' registrada'}
          {promotions.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white hover:bg-indigo-500"
        >
          <Plus className="mr-1.5 size-4" />
          Nueva promoción
        </Button>
      </div>

      {promotions.length === 0
        ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 py-16 text-center">
              <Tag className="mb-3 size-10 text-zinc-600" />
              <p className="font-medium text-zinc-400">No hay promociones creadas</p>
              <p className="mt-1 text-sm text-zinc-600">
                Creá precios especiales, descuentos o combos para el POS.
              </p>
            </div>
          )
        : (
            <div className="space-y-2">
              {promotions.map((promo) => {
                const now = new Date();
                const started = !promo.startsAt || new Date(promo.startsAt) <= now;
                const notEnded = !promo.endsAt || new Date(promo.endsAt) >= now;
                const isVigente = promo.isActive && started && notEnded;

                return (
                  <div
                    key={promo.id}
                    className={`flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors ${
                      isVigente
                        ? 'border-zinc-700 bg-zinc-900'
                        : 'border-zinc-800 bg-zinc-900/50 opacity-60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TYPE_COLORS[promo.type]}`}>
                          {TYPE_LABELS[promo.type]}
                        </span>
                        <span className="text-sm font-medium text-zinc-200">{promo.name}</span>
                        {promo.isStackable
                          ? <span className="text-[10px] text-emerald-500">acumulable</span>
                          : <span className="text-[10px] text-zinc-600">exclusiva</span>}
                        {isVigente && (
                          <Badge className="bg-emerald-900 text-[10px] text-emerald-400">VIGENTE</Badge>
                        )}
                        {!promo.isActive && (
                          <Badge className="bg-zinc-800 text-[10px] text-zinc-500">INACTIVA</Badge>
                        )}
                      </div>
                      <div className="mt-1">
                        <PromotionSummary promo={promo} />
                      </div>
                      {(promo.startsAt || promo.endsAt) && (
                        <p className="mt-0.5 text-xs text-zinc-600">
                          {promo.startsAt ? `Desde ${formatDate(promo.startsAt)}` : ''}
                          {promo.startsAt && promo.endsAt ? ' — ' : ''}
                          {promo.endsAt ? `Hasta ${formatDate(promo.endsAt)}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(promo)}
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                          promo.isActive
                            ? 'border border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                            : 'border border-emerald-800 text-emerald-500 hover:bg-emerald-950'
                        }`}
                      >
                        {promo.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(promo)}
                        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      {confirmDelete === promo.id
                        ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(promo.id)}
                              disabled={deleting === promo.id}
                              className="rounded border border-red-700 bg-red-950 px-2 py-1 text-xs text-red-400 hover:bg-red-900"
                            >
                              Confirmar
                            </button>
                          )
                        : (
                            <button
                              type="button"
                              onClick={() => handleDelete(promo.id)}
                              disabled={deleting === promo.id}
                              className="rounded p-1.5 text-zinc-600 hover:bg-red-950 hover:text-red-400"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
    </div>
  );
};
