'use client';

import { CalendarDays, Package2, Percent, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  targetProductId: string;
  promoPrice: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  discountScope: 'product' | 'category' | 'total';
  discountTargetProductId: string;
  targetCategoryId: string;
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

const TYPE_OPTIONS = [
  {
    value: 'product_price' as const,
    label: 'Precio especial',
    desc: 'Precio fijo para un producto',
    icon: Tag,
    active: 'border-sky-600 bg-sky-950/50 text-sky-200',
    iconActive: 'text-sky-400',
    inactive: 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600',
    iconInactive: 'text-zinc-600',
  },
  {
    value: 'discount' as const,
    label: 'Descuento',
    desc: '% o monto sobre producto, categoría o total',
    icon: Percent,
    active: 'border-amber-600 bg-amber-950/50 text-amber-200',
    iconActive: 'text-amber-400',
    inactive: 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600',
    iconInactive: 'text-zinc-600',
  },
  {
    value: 'combo' as const,
    label: 'Combo',
    desc: 'Precio especial combinando productos',
    icon: Package2,
    active: 'border-violet-600 bg-violet-950/50 text-violet-200',
    iconActive: 'text-violet-400',
    inactive: 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600',
    iconInactive: 'text-zinc-600',
  },
];

type Props = {
  initial?: Partial<FormState> & { id?: number };
  onSaved: () => void;
  onCancel: () => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
      {children}
    </p>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-emerald-600' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

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

  const inputClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30 transition-colors';
  const selectClass = inputClass;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/60 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Nombre y descripción */}
      <div>
        <SectionLabel>Información general</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">
              Nombre
              {' '}
              <span className="text-emerald-600">*</span>
            </Label>
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
      </div>

      {/* Tipo */}
      <div>
        <SectionLabel>
          Tipo de promoción
          {' '}
          <span className="text-emerald-600">*</span>
        </SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((t) => {
            const Icon = t.icon;
            const isSelected = form.type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => set('type', t.value)}
                className={`rounded-xl border p-3.5 text-left transition-all ${
                  isSelected ? t.active : t.inactive
                }`}
              >
                <Icon className={`mb-2 size-5 ${isSelected ? t.iconActive : t.iconInactive}`} />
                <p className="text-sm font-semibold leading-tight">{t.label}</p>
                <p className="mt-1 text-[11px] leading-tight opacity-70">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campos por tipo */}
      {form.type === 'product_price' && (
        <div>
          <SectionLabel>Configuración del precio</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs text-zinc-400">
                Producto
                {' '}
                <span className="text-emerald-600">*</span>
              </Label>
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
              <Label className="mb-1.5 block text-xs text-zinc-400">
                Precio promocional
                {' '}
                <span className="text-emerald-600">*</span>
              </Label>
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
        </div>
      )}

      {form.type === 'discount' && (
        <div className="space-y-4">
          <SectionLabel>Configuración del descuento</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs text-zinc-400">
                Tipo de descuento
                {' '}
                <span className="text-emerald-600">*</span>
              </Label>
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
                {form.discountType === 'percent' ? 'Porcentaje' : 'Monto en pesos'}
                {' '}
                <span className="text-emerald-600">*</span>
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
            <Label className="mb-2 block text-xs text-zinc-400">
              Aplica sobre
              {' '}
              <span className="text-emerald-600">*</span>
            </Label>
            <div className="flex gap-2">
              {(
                [
                  { value: 'total', label: 'Total de la venta' },
                  { value: 'product', label: 'Producto' },
                  { value: 'category', label: 'Categoría' },
                ] as const
              ).map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('discountScope', s.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    form.discountScope === s.value
                      ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300'
                      : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {form.discountScope === 'product' && (
            <div>
              <Label className="mb-1.5 block text-xs text-zinc-400">
                Producto
                {' '}
                <span className="text-emerald-600">*</span>
              </Label>
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
              <Label className="mb-1.5 block text-xs text-zinc-400">
                Categoría
                {' '}
                <span className="text-emerald-600">*</span>
              </Label>
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
          <SectionLabel>Configuración del combo</SectionLabel>
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">
              Precio del combo
              {' '}
              <span className="text-emerald-600">*</span>
            </Label>
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
            <div className="mb-2.5 flex items-center justify-between">
              <Label className="text-xs text-zinc-400">
                Productos del combo
                {' '}
                <span className="text-zinc-600">(mín. 2)</span>
                {' '}
                <span className="text-emerald-600">*</span>
              </Label>
              <button
                type="button"
                onClick={addComboItem}
                className="text-xs font-medium text-emerald-500 transition-colors hover:text-emerald-400"
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
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition-colors focus:border-emerald-600 focus:outline-none"
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
                    className="w-20 rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-center text-sm text-zinc-200 transition-colors focus:border-emerald-600 focus:outline-none"
                  />
                  {form.comboItems.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeComboItem(idx)}
                      className="flex size-8 items-center justify-center rounded-lg text-lg text-zinc-600 transition-colors hover:bg-red-950/60 hover:text-red-400"
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
      <div>
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="size-3.5 text-zinc-500" />
          <SectionLabel>Período de validez</SectionLabel>
        </div>
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
        <p className="mt-2 text-xs text-zinc-600">Dejá vacío para que no tenga vencimiento.</p>
      </div>

      {/* Opciones */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
        <SectionLabel>Opciones</SectionLabel>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Promoción activa</p>
              <p className="text-xs text-zinc-500">Se aplica en el POS al momento de la venta</p>
            </div>
            <Toggle checked={form.isActive} onChange={v => set('isActive', v)} />
          </div>
          <div className="flex items-center justify-between border-t border-zinc-700/50 pt-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Acumulable con otras</p>
              <p className="text-xs text-zinc-500">
                {form.isStackable
                  ? 'Se puede combinar con otras promociones activas'
                  : 'Exclusiva — no se combina con otras promociones'}
              </p>
            </div>
            <Toggle checked={form.isStackable} onChange={v => set('isStackable', v)} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t border-zinc-800 pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
          className="border-zinc-700 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="bg-emerald-600 text-white shadow-md shadow-emerald-900/30 hover:bg-emerald-500"
        >
          {saving ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Crear promoción'}
        </Button>
      </div>
    </form>
  );
};
