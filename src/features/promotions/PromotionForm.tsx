'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Product = { id: number; name: string; price: string; categoryId: number | null };
type Category = { id: number; name: string };

type ComboItemRow = { _key: number; productId: number; quantity: number };

type FormState = {
  name: string;
  description: string;
  type: 'product_price' | 'discount' | 'combo';
  isActive: boolean;
  isStackable: boolean;
  startsAt: string;
  endsAt: string;
  // product_price
  targetProductId: string;
  promoPrice: string;
  // discount
  discountType: 'percent' | 'fixed';
  discountValue: string;
  discountScope: 'product' | 'category' | 'total';
  discountTargetProductId: string;
  targetCategoryId: string;
  // combo
  comboPrice: string;
  comboItems: ComboItemRow[];
};

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  type: 'product_price',
  isActive: true,
  isStackable: false,
  startsAt: '',
  endsAt: '',
  targetProductId: '',
  promoPrice: '',
  discountType: 'percent',
  discountValue: '',
  discountScope: 'total',
  discountTargetProductId: '',
  targetCategoryId: '',
  comboPrice: '',
  comboItems: [
    { _key: 1, productId: 0, quantity: 1 },
    { _key: 2, productId: 0, quantity: 1 },
  ],
};

type Props = {
  initial?: Partial<FormState> & { id?: number };
  onSaved: () => void;
  onCancel: () => void;
};

export const PromotionForm = ({ initial, onSaved, onCancel }: Props) => {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()).catch(() => []),
      fetch('/api/categories').then(r => r.json()).catch(() => []),
    ]).then(([prods, cats]) => {
      setProducts(Array.isArray(prods) ? prods.filter((p: Product) => p) : []);
      setCategories(Array.isArray(cats) ? cats : []);
    });
  }, []);

  const set = (field: keyof FormState, value: FormState[keyof FormState]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const addComboItem = () =>
    set('comboItems', [...form.comboItems, { _key: Date.now(), productId: 0, quantity: 1 }]);

  const removeComboItem = (idx: number) =>
    set('comboItems', form.comboItems.filter((_, i) => i !== idx));

  const updateComboItem = (idx: number, field: keyof ComboItemRow, value: number) =>
    set(
      'comboItems',
      form.comboItems.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description || null,
        type: form.type,
        isActive: form.isActive,
        isStackable: form.isStackable,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
      };

      if (form.type === 'product_price') {
        payload.targetProductId = Number(form.targetProductId);
        payload.promoPrice = form.promoPrice;
      } else if (form.type === 'discount') {
        payload.discountType = form.discountType;
        payload.discountValue = form.discountValue;
        payload.discountScope = form.discountScope;
        if (form.discountScope === 'product') {
          payload.targetProductId = Number(form.discountTargetProductId);
        } else if (form.discountScope === 'category') {
          payload.targetCategoryId = Number(form.targetCategoryId);
        }
      } else if (form.type === 'combo') {
        payload.comboPrice = form.comboPrice;
        payload.comboItems = form.comboItems
          .filter(i => i.productId > 0)
          .map(({ productId, quantity }) => ({ productId, quantity }));
      }

      const url = initial?.id ? `/api/promotions/${initial.id}` : '/api/promotions';
      const method = initial?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Error al guardar la promoción');
        return;
      }

      onSaved();
    } catch {
      setError('Error de red');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none';
  const selectClass = inputClass;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Nombre y descripción */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs text-zinc-400">Nombre *</Label>
          <Input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ej: 2x1 Gaseosas"
            required
            className={inputClass}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-zinc-400">Descripción</Label>
          <Input
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Opcional"
            className={inputClass}
          />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <Label className="mb-1.5 block text-xs text-zinc-400">Tipo de promoción *</Label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: 'product_price', label: 'Precio especial', desc: 'Precio promocional para un producto' },
              { value: 'discount', label: 'Descuento', desc: '% o monto sobre producto, categoría o total' },
              { value: 'combo', label: 'Combo', desc: 'Precio especial al combinar productos' },
            ] as const
          ).map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('type', t.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                form.type === t.value
                  ? 'border-indigo-600 bg-indigo-950 text-indigo-300'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <p className="text-sm font-medium">{t.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Campos específicos por tipo */}
      {form.type === 'product_price' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">Producto *</Label>
            <select
              value={form.targetProductId}
              onChange={e => set('targetProductId', e.target.value)}
              required
              className={selectClass}
            >
              <option value="">Seleccionar producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {' '}
                  (precio normal: $
                  {Number(p.price).toLocaleString('es-AR')}
                  )
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">Precio promocional *</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.promoPrice}
              onChange={e => set('promoPrice', e.target.value)}
              placeholder="0.00"
              required
              className={inputClass}
            />
          </div>
        </div>
      )}

      {form.type === 'discount' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs text-zinc-400">Tipo de descuento *</Label>
              <select
                value={form.discountType}
                onChange={e => set('discountType', e.target.value as 'percent' | 'fixed')}
                className={selectClass}
              >
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-zinc-400">
                {form.discountType === 'percent' ? 'Porcentaje *' : 'Monto en pesos *'}
              </Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                max={form.discountType === 'percent' ? 100 : undefined}
                value={form.discountValue}
                onChange={e => set('discountValue', e.target.value)}
                placeholder={form.discountType === 'percent' ? '10' : '500.00'}
                required
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">Aplica sobre *</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: 'total', label: 'Total de la venta' },
                  { value: 'product', label: 'Producto específico' },
                  { value: 'category', label: 'Categoría' },
                ] as const
              ).map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('discountScope', s.value)}
                  className={`rounded border px-3 py-2 text-sm transition-colors ${
                    form.discountScope === s.value
                      ? 'border-indigo-600 bg-indigo-950 text-indigo-300'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {form.discountScope === 'product' && (
            <div>
              <Label className="mb-1.5 block text-xs text-zinc-400">Producto *</Label>
              <select
                value={form.discountTargetProductId}
                onChange={e => set('discountTargetProductId', e.target.value)}
                required
                className={selectClass}
              >
                <option value="">Seleccionar producto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          {form.discountScope === 'category' && (
            <div>
              <Label className="mb-1.5 block text-xs text-zinc-400">Categoría *</Label>
              <select
                value={form.targetCategoryId}
                onChange={e => set('targetCategoryId', e.target.value)}
                required
                className={selectClass}
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {form.type === 'combo' && (
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">Precio del combo *</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.comboPrice}
              onChange={e => set('comboPrice', e.target.value)}
              placeholder="0.00"
              required
              className={inputClass}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Productos del combo (mín. 2) *</Label>
              <button
                type="button"
                onClick={addComboItem}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                + Agregar producto
              </button>
            </div>
            <div className="space-y-2">
              {form.comboItems.map((item, idx) => (
                <div key={item._key} className="flex items-center gap-2">
                  <select
                    value={item.productId || ''}
                    onChange={e => updateComboItem(idx, 'productId', Number(e.target.value))}
                    required
                    className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200"
                  >
                    <option value="">Producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateComboItem(idx, 'quantity', Number(e.target.value))}
                    className="w-20 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200"
                  />
                  {form.comboItems.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeComboItem(idx)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vigencia */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs text-zinc-400">Válida desde</Label>
          <Input
            type="datetime-local"
            value={form.startsAt}
            onChange={e => set('startsAt', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-zinc-400">Válida hasta</Label>
          <Input
            type="datetime-local"
            value={form.endsAt}
            onChange={e => set('endsAt', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Opciones */}
      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={e => set('isActive', e.target.checked)}
            className="size-4 rounded border-zinc-600 bg-zinc-800"
          />
          Activa
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={form.isStackable}
            onChange={e => set('isStackable', e.target.checked)}
            className="size-4 rounded border-zinc-600 bg-zinc-800"
          />
          <span>
            Se acumula con otras promociones
            {form.isStackable
              ? <Badge className="ml-1.5 bg-emerald-900 text-[10px] text-emerald-400">SÍ</Badge>
              : <Badge className="ml-1.5 bg-zinc-700 text-[10px] text-zinc-400">NO</Badge>}
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
          className="border-zinc-700 bg-transparent text-zinc-400 hover:bg-zinc-800"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white hover:bg-indigo-500"
        >
          {saving ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Crear promoción'}
        </Button>
      </div>
    </form>
  );
};
