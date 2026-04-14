'use client';

import { useEffect, useRef, useState } from 'react';

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
  barcode: string | null;
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
  /** Pre-rellena el campo barcode (usado desde el flujo de escaneo) */
  initialBarcode?: string;
};

/** Respuesta de Open Food Facts para un código de barras */
type OFFProduct = {
  status: number;
  product?: {
    product_name?: string;
    image_front_url?: string;
    image_url?: string;
  };
};

export const ProductForm = ({
  open,
  onClose,
  onSuccess,
  product,
  isAdmin,
  initialBarcode,
}: ProductFormProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product?.price ?? '');
  const [costPrice, setCostPrice] = useState(product?.costPrice ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [barcode, setBarcode] = useState(product?.barcode ?? initialBarcode ?? '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '');
  const [categoryId, setCategoryId] = useState<string>(
    product?.categoryId ? String(product.categoryId) : '',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para el manejo de imagen
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [suggestedImage, setSuggestedImage] = useState<string | null>(null);
  const [fetchingImage, setFetchingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditing = !!product;

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(setCategories);
  }, []);

  /**
   * Busca automáticamente la imagen de un producto en Open Food Facts
   * cuando el código de barras tiene al menos 8 dígitos.
   * Solo sugiere si todavía no hay una imagen cargada.
   */
  useEffect(() => {
    if (barcodeDebounceRef.current) {
      clearTimeout(barcodeDebounceRef.current);
    }

    // Solo buscar si el código tiene longitud mínima y no hay imagen ya asignada
    if (barcode.length < 8 || imageUrl) {
      setSuggestedImage(null);
      return;
    }

    barcodeDebounceRef.current = setTimeout(async () => {
      setFetchingImage(true);
      setSuggestedImage(null);
      try {
        const res = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
        );
        if (!res.ok) {
          return;
        }
        const data: OFFProduct = await res.json();
        if (data.status === 1 && data.product) {
          const img = data.product.image_front_url ?? data.product.image_url ?? null;
          if (img) {
            setSuggestedImage(img);
          }
        }
      } catch {
        // Silencioso — la búsqueda de imagen es un plus, no bloquea el flujo
      } finally {
        setFetchingImage(false);
      }
    }, 800);

    return () => {
      if (barcodeDebounceRef.current) {
        clearTimeout(barcodeDebounceRef.current);
      }
    };
  }, [barcode, imageUrl]);

  /** Sube el archivo seleccionado a Cloudinary vía el endpoint de la API */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? 'Error al subir la imagen');
        return;
      }

      setImageUrl(data.url);
      setSuggestedImage(null);
    } catch {
      setUploadError('Error de conexión al subir la imagen');
    } finally {
      setUploading(false);
      // Limpiar el input para permitir volver a seleccionar el mismo archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
          barcode,
          imageUrl: imageUrl || null,
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
              <Label htmlFor="barcode">Código de barras</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                placeholder="EAN-13, UPC..."
              />
              {fetchingImage && (
                <p className="text-xs text-muted-foreground">Buscando imagen...</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU interno</Label>
              <Input
                id="sku"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="Ej: CAFE-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          {/* ── Sección de imagen ── */}
          <div className="space-y-2">
            <Label>Imagen del producto</Label>

            {/* Sugerencia automática desde Open Food Facts */}
            {suggestedImage && !imageUrl && (
              <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={suggestedImage}
                  alt="Imagen encontrada"
                  className="size-12 rounded object-contain"
                />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Imagen encontrada por codigo de barras
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Fuente: Open Food Facts
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 border-blue-300 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
                    onClick={() => {
                      setImageUrl(suggestedImage);
                      setSuggestedImage(null);
                    }}
                  >
                    Usar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => setSuggestedImage(null)}
                  >
                    Ignorar
                  </Button>
                </div>
              </div>
            )}

            {/* Preview de la imagen actual */}
            {imageUrl && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Preview del producto"
                  className="size-16 rounded-md border object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => setImageUrl('')}
                >
                  Quitar imagen
                </Button>
              </div>
            )}

            {/* Input de archivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Controles de upload y URL */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
              >
                {uploading ? 'Subiendo...' : 'Subir imagen'}
              </Button>
              <span className="text-xs text-muted-foreground">o pegar URL:</span>
              <Input
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setSuggestedImage(null);
                }}
                placeholder="https://..."
                className="h-8 text-sm"
              />
            </div>

            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
