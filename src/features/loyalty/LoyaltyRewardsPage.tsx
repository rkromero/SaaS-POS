'use client';

import { Edit2, Gift, Package, Percent, Plus, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Reward = {
  id: number;
  name: string;
  description: string | null;
  type: 'product' | 'discount_fixed' | 'discount_percent';
  pointsCost: number;
  discountValue: string | null;
  productId: number | null;
  stock: number | null;
  isActive: boolean;
};

type RewardForm = {
  name: string;
  description: string;
  type: Reward['type'];
  pointsCost: string;
  discountValue: string;
  stock: string;
};

const EMPTY_FORM: RewardForm = {
  name: '',
  description: '',
  type: 'discount_fixed',
  pointsCost: '',
  discountValue: '',
  stock: '',
};

function typeIcon(type: Reward['type']) {
  if (type === 'product') {
    return <Package className="size-4 text-blue-500" />;
  }
  if (type === 'discount_percent') {
    return <Percent className="size-4 text-green-500" />;
  }
  return <Tag className="size-4 text-orange-500" />;
}

function typeLabel(type: Reward['type']) {
  if (type === 'product') {
    return 'Producto gratis';
  }
  if (type === 'discount_percent') {
    return 'Descuento %';
  }
  return 'Descuento fijo';
}

function rewardValueDisplay(reward: Reward): string {
  if (reward.type === 'discount_fixed') {
    return `$${Number(reward.discountValue ?? 0).toLocaleString('es-AR')} de descuento`;
  }
  if (reward.type === 'discount_percent') {
    return `${reward.discountValue}% de descuento`;
  }
  return 'Producto gratis';
}

export const LoyaltyRewardsPage = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RewardForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadRewards = async () => {
    try {
      const res = await fetch('/api/loyalty/rewards');
      const data = await res.json();
      setRewards(data);
    } catch {
      // silently fail, list stays empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (reward: Reward) => {
    setForm({
      name: reward.name,
      description: reward.description ?? '',
      type: reward.type,
      pointsCost: String(reward.pointsCost),
      discountValue: reward.discountValue ?? '',
      stock: reward.stock !== null ? String(reward.stock) : '',
    });
    setEditingId(reward.id);
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!form.name.trim()) {
      setFormError('El nombre es requerido');
      return;
    }
    if (!form.pointsCost || Number(form.pointsCost) <= 0) {
      setFormError('El costo en puntos debe ser mayor a 0');
      return;
    }
    if (form.type !== 'product' && (!form.discountValue || Number(form.discountValue) <= 0)) {
      setFormError('El valor de descuento es requerido');
      return;
    }
    if (form.type === 'discount_percent' && Number(form.discountValue) > 100) {
      setFormError('El porcentaje no puede superar 100');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        type: form.type,
        pointsCost: Number(form.pointsCost),
        discountValue: form.discountValue ? Number(form.discountValue) : null,
        stock: form.stock ? Number(form.stock) : null,
      };

      const res = editingId
        ? await fetch(`/api/loyalty/rewards/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        : await fetch('/api/loyalty/rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error ?? 'Error al guardar');
        return;
      }

      setShowForm(false);
      await loadRewards();
    } catch {
      setFormError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (reward: Reward) => {
    await fetch(`/api/loyalty/rewards/${reward.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !reward.isActive }),
    });
    await loadRewards();
  };

  const handleDelete = async (id: number) => {
    if (deletingId !== id) {
      // Primera pulsación: pedir confirmación
      setDeletingId(id);
      return;
    }
    // Segunda pulsación: confirmar y eliminar
    setDeletingId(null);
    await fetch(`/api/loyalty/rewards/${id}`, { method: 'DELETE' });
    await loadRewards();
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando premios...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rewards.length === 0
            ? 'No hay premios cargados todavía.'
            : `${rewards.filter(r => r.isActive).length} activos de ${rewards.length} total`}
        </p>
        <Button size="sm" onClick={openCreate} className="flex items-center gap-1.5">
          <Plus className="size-4" />
          Nuevo premio
        </Button>
      </div>

      {/* Lista de premios */}
      <div className="space-y-3">
        {rewards.map(reward => (
          <div
            key={reward.id}
            className={`flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-opacity ${
              !reward.isActive ? 'opacity-50' : ''
            }`}
          >
            <div className="shrink-0">{typeIcon(reward.type)}</div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{reward.name}</span>
                <Badge variant="secondary" className="text-xs">{typeLabel(reward.type)}</Badge>
                {!reward.isActive && <Badge variant="outline" className="text-xs">Inactivo</Badge>}
              </div>
              {reward.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{reward.description}</p>
              )}
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {reward.pointsCost.toLocaleString('es-AR')}
                  {' '}
                  puntos
                </span>
                <span>→</span>
                <span className="font-medium text-green-600">{rewardValueDisplay(reward)}</span>
                {reward.stock !== null && (
                  <span>
                    · Stock:
                    {' '}
                    {reward.stock}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleActive(reward)}
                title={reward.isActive ? 'Desactivar' : 'Activar'}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  reward.isActive ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${
                    reward.isActive ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(reward)}>
                <Edit2 className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(reward.id)}
                onBlur={() => setDeletingId(null)}
                className={deletingId === reward.id ? 'text-destructive ring-1 ring-destructive' : 'text-destructive hover:text-destructive'}
                title={deletingId === reward.id ? 'Clic de nuevo para confirmar' : 'Desactivar'}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
              <Gift className="size-5" />
              {editingId ? 'Editar premio' : 'Nuevo premio'}
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre del premio *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Café gratis, 10% de descuento..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción opcional"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de premio *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['discount_fixed', 'discount_percent', 'product'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`rounded-md border p-2 text-xs font-medium transition-colors ${
                        form.type === t
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      {typeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Costo en puntos *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.pointsCost}
                  onChange={e => setForm(f => ({ ...f, pointsCost: e.target.value }))}
                  placeholder="Ej: 500"
                />
              </div>

              {form.type !== 'product' && (
                <div className="space-y-1.5">
                  <Label>
                    {form.type === 'discount_fixed' ? 'Descuento en pesos *' : 'Porcentaje de descuento *'}
                  </Label>
                  <div className="flex items-center gap-2">
                    {form.type === 'discount_fixed' && <span className="text-sm text-muted-foreground">$</span>}
                    <Input
                      type="number"
                      min="0.01"
                      max={form.type === 'discount_percent' ? 100 : undefined}
                      value={form.discountValue}
                      onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                      placeholder={form.type === 'discount_fixed' ? 'Ej: 500' : 'Ej: 10'}
                    />
                    {form.type === 'discount_percent' && <span className="text-sm text-muted-foreground">%</span>}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Stock disponible (opcional)</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="Sin límite"
                />
                <p className="text-xs text-muted-foreground">Dejá vacío para canjes ilimitados.</p>
              </div>
            </div>

            {formError && <p className="mt-3 text-sm text-destructive">{formError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear premio'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
