'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Category = { id: number; name: string };

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  costPrice: string | null;
  sku: string | null;
  imageUrl: string | null;
  categoryId: number | null;
  isActive: boolean;
};

type ProductFormProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
  isAdmin: boolean;
};

export const ProductForm = ({
  open,
  onClose,
  onSuccess,
  product,
  isAdmin,
}: ProductFormProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product?.price ?? '');
  const [costPrice, setCostPrice] = useState(product?.costPrice ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '');
  const [categoryId, setCategoryId] = useState<string>(
    product?.categoryId ? String(product.categoryId) : '',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!product;

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(setCategories);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!price || Number.isNaN(Number(price))) {
      setError('El precio de venta es requerido');
      return;
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/products/${product.id}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          costPrice: costPrice ? Number(costPrice) : null,
          sku,
          imageUrl,
          categoryId: categoryId ? Number(categoryId) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Error al guardar');
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Café con leche"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descripción opcional"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio de venta *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {isAdmin && (
              <div className="space-y-1.5">
                <Label htmlFor="costPrice">Precio de costo</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU / Código</Label>
              <Input
                id="sku"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="Ej: CAFE-001"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Categoría</Label>
              <select
                id="category"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Sin categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="imageUrl">URL de imagen</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
