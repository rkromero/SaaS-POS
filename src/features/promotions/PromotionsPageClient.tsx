'use client';

import { Package2, Pencil, Percent, Plus, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  usageLimit: number | null;
  usageCount: number;
};

const TYPE_CONFIG = {
  product_price: {
    label: 'Precio especial',
    icon: Tag,
    borderAccent: 'border-l-sky-400',
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-50',
  },
  discount: {
    label: 'Descuento',
    icon: Percent,
    borderAccent: 'border-l-amber-400',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
  },
  combo: {
    label: 'Combo',
    icon: Package2,
    borderAccent: 'border-l-violet-400',
    badge: 'bg-violet-50 text-violet-700 border border-violet-200',
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-50',
  },
} as const;

function formatDate(d: string | null) {
  if (!d) {
    return null;
  }
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function PromotionSummary({ promo }: { promo: Promotion }) {
  if (promo.type === 'product_price') {
    return (
      <span className="text-sm text-muted-foreground">
        {promo.targetProductName ?? '—'}
        <span className="mx-1.5 text-muted-foreground/40">→</span>
        <span className="font-semibold text-emerald-600">
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
        : `en cat. "${promo.targetCategoryName}"`;
    return (
      <span className="text-sm">
        <span className="font-semibold text-amber-600">{val}</span>
        <span className="ml-1.5 text-muted-foreground">{scope}</span>
      </span>
    );
  }
  if (promo.type === 'combo') {
    const itemsList = promo.comboItems.map(i => `${i.quantity}× ${i.productName}`).join(' + ');
    return (
      <span className="text-sm text-muted-foreground">
        {itemsList}
        <span className="mx-1.5 text-muted-foreground/40">→</span>
        <span className="font-semibold text-emerald-600">
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
    usageLimit: promo.usageLimit ? String(promo.usageLimit) : '',
  };
}

type FilterType = 'all' | 'product_price' | 'discount' | 'combo';

export const PromotionsPageClient = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

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
      body: JSON.stringify({ ...buildFormInitial(promo), isActive: !promo.isActive }),
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
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (showForm || editing) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b pb-5">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditing(null);
            }}
            className="rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ← Volver
          </button>
          <h2 className="text-base font-semibold text-foreground">
            {editing ? 'Editar promoción' : 'Nueva promoción'}
          </h2>
        </div>
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

  const now = new Date();
  const activeCount = promotions.filter((p) => {
    const started = !p.startsAt || new Date(p.startsAt) <= now;
    const notEnded = !p.endsAt || new Date(p.endsAt) >= now;
    return p.isActive && started && notEnded;
  }).length;

  const filtered = filter === 'all' ? promotions : promotions.filter(p => p.type === filter);

  const filterTabs: { value: FilterType; label: string }[] = [
    { value: 'all', label: `Todas (${promotions.length})` },
    { value: 'product_price', label: 'Precio especial' },
    { value: 'discount', label: 'Descuento' },
    { value: 'combo', label: 'Combo' },
  ];

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {promotions.length === 0
            ? 'Sin promociones creadas'
            : activeCount > 0
              ? (
                  <>
                    <span className="font-semibold text-emerald-600">{activeCount}</span>
                    {' '}
                    activa
                    {activeCount !== 1 ? 's' : ''}
                    {' de '}
                    {promotions.length}
                  </>
                )
              : (
                  <>
                    {promotions.length}
                    {' '}
                    promoción
                    {promotions.length !== 1 ? 'es' : ''}
                  </>
                )}
        </p>
        <Button
          onClick={() => setShowForm(true)}
          className="shrink-0 bg-emerald-600 text-white shadow-sm hover:bg-emerald-500"
        >
          <Plus className="mr-1.5 size-4" />
          Nueva promoción
        </Button>
      </div>

      {/* Filter tabs */}
      {promotions.length > 0 && (
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {filterTabs.map(tab => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === tab.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {promotions.length === 0
        ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                <Tag className="size-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">No hay promociones creadas</p>
              <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                Creá precios especiales, descuentos o combos para aplicar en el POS.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="mt-5 bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <Plus className="mr-1.5 size-4" />
                Crear primera promoción
              </Button>
            </div>
          )
        : filtered.length === 0
          ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                No hay promociones de este tipo.
              </div>
            )
          : (
              <div className="space-y-2">
                {filtered.map((promo) => {
                  const started = !promo.startsAt || new Date(promo.startsAt) <= now;
                  const notEnded = !promo.endsAt || new Date(promo.endsAt) >= now;
                  const isVigente = promo.isActive && started && notEnded;
                  const isExpired = promo.isActive && !!promo.endsAt && new Date(promo.endsAt) < now;
                  const cfg = TYPE_CONFIG[promo.type];
                  const TypeIcon = cfg.icon;

                  return (
                    <div
                      key={promo.id}
                      className={`flex items-center gap-3 rounded-xl border border-l-4 bg-card px-4 py-3.5 shadow-sm transition-all ${cfg.borderAccent} ${
                        !promo.isActive ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Type icon */}
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${cfg.iconBg}`}>
                        <TypeIcon className={`size-4 ${cfg.iconColor}`} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          <span className="text-sm font-medium text-foreground">{promo.name}</span>
                          {isVigente && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                              <span className="inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
                              Vigente
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                              Vencida
                            </span>
                          )}
                          {!promo.isActive && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Inactiva
                            </span>
                          )}
                          {promo.isStackable && (
                            <span className="text-[10px] text-emerald-600">acumulable</span>
                          )}
                        </div>
                        <div className="mt-0.5">
                          <PromotionSummary promo={promo} />
                        </div>
                        {(promo.startsAt || promo.endsAt) && (
                          <p className="mt-0.5 text-xs text-muted-foreground/60">
                            {promo.startsAt ? `Desde ${formatDate(promo.startsAt)}` : ''}
                            {promo.startsAt && promo.endsAt ? ' — ' : ''}
                            {promo.endsAt ? `Hasta ${formatDate(promo.endsAt)}` : ''}
                          </p>
                        )}
                        {promo.usageLimit != null && (
                          <p className={`mt-0.5 text-xs font-medium ${
                            promo.usageCount >= promo.usageLimit
                              ? 'text-red-500'
                              : promo.usageCount >= promo.usageLimit * 0.8
                                ? 'text-amber-600'
                                : 'text-muted-foreground/60'
                          }`}
                          >
                            {promo.usageCount}
                            {' / '}
                            {promo.usageLimit}
                            {' usos'}
                            {promo.usageCount >= promo.usageLimit ? ' — límite alcanzado' : ''}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        {/* Toggle switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(promo)}
                          title={promo.isActive ? 'Desactivar' : 'Activar'}
                          className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none ${
                            promo.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${
                              promo.isActive ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditing(promo)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </button>

                        {confirmDelete === promo.id
                          ? (
                              <button
                                type="button"
                                onClick={() => handleDelete(promo.id)}
                                disabled={deleting === promo.id}
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                              >
                                ¿Eliminar?
                              </button>
                            )
                          : (
                              <button
                                type="button"
                                onClick={() => handleDelete(promo.id)}
                                disabled={deleting === promo.id}
                                className="rounded-lg p-1.5 text-muted-foreground/50 transition-colors hover:bg-red-50 hover:text-red-500"
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
