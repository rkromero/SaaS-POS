'use client';

import { Package, Search, ShoppingCart, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type PriceCheckerProduct = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  categoryName: string | null;
  isActive: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PriceCheckerModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<PriceCheckerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PriceCheckerProduct | null>(null);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addToCartBtnRef = useRef<HTMLButtonElement>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  // Cargar productos al abrir el modal
  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery('');
    setSelectedProduct(null);
    setHighlightedIdx(0);
    setLoading(true);
    fetch('/api/products')
      .then(r => r.json())
      .then((data: PriceCheckerProduct[]) => {
        setProducts(data.filter(p => p.isActive));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Foco: input al abrir, botón al ver detalle
  useEffect(() => {
    if (!open) {
      return;
    }
    if (selectedProduct) {
      setTimeout(() => addToCartBtnRef.current?.focus(), 50);
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, selectedProduct]);

  // Scroll el ítem resaltado al centro de la lista
  useEffect(() => {
    highlightedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIdx]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return products.slice(0, 15);
    }
    return products
      .filter(
        p =>
          p.name.toLowerCase().includes(q)
          || (p.barcode ?? '').includes(q)
          || (p.sku ?? '').toLowerCase().includes(q),
      )
      .slice(0, 15);
  }, [query, products]);

  // Reiniciar índice cuando cambian los resultados
  useEffect(() => {
    setHighlightedIdx(0);
  }, [filtered.length]);

  const selectProduct = (p: PriceCheckerProduct) => setSelectedProduct(p);

  const addToCartAndClose = () => {
    if (!selectedProduct) {
      return;
    }
    // Despachar evento para que POSScreen (si está montado) agregue al carrito
    windowDispatchAddToCart(selectedProduct);
    onClose();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightedIdx]) {
        selectProduct(filtered[highlightedIdx]);
      }
    }
  };

  const handleDetailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addToCartAndClose();
    }
  };

  const formattedPrice = (price: string) =>
    `$${Number(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onKeyDown={selectedProduct ? handleDetailKeyDown : undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-4" />
            Consultar precio
            <Badge variant="outline" className="ml-auto text-xs font-normal">F10</Badge>
          </DialogTitle>
        </DialogHeader>

        {selectedProduct
          ? (
            // ── Vista de detalle de producto ──────────────────────────────────
              <div className="space-y-4">
                <div className="flex gap-4">
                  {selectedProduct.imageUrl
                    ? (
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border">
                          <Image
                            src={selectedProduct.imageUrl}
                            alt={selectedProduct.name}
                            fill
                            className="object-contain"
                            sizes="80px"
                          />
                        </div>
                      )
                    : (
                        <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border bg-muted">
                          <Package className="size-8 text-muted-foreground" />
                        </div>
                      )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold">{selectedProduct.name}</p>
                    {selectedProduct.categoryName && (
                      <p className="text-sm text-muted-foreground">{selectedProduct.categoryName}</p>
                    )}
                    {(selectedProduct.sku || selectedProduct.barcode) && (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {selectedProduct.barcode ?? selectedProduct.sku}
                      </p>
                    )}
                  </div>
                </div>

                {selectedProduct.description && (
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                )}

                <div className="rounded-xl bg-green-50 px-4 py-3 dark:bg-green-950">
                  <p className="text-sm text-muted-foreground">Precio</p>
                  <p className="text-4xl font-bold tracking-tight text-green-600 dark:text-green-400">
                    {formattedPrice(selectedProduct.price)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedProduct(null)}
                  >
                    <X className="mr-1 size-4" />
                    Volver
                  </Button>
                  <Button
                    ref={addToCartBtnRef}
                    className="flex-1"
                    onClick={addToCartAndClose}
                  >
                    <ShoppingCart className="mr-1 size-4" />
                    Agregar
                    <kbd className="ml-2 rounded bg-white/20 px-1 text-xs">Enter</kbd>
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Enter para agregar al carrito · Esc para cerrar
                </p>
              </div>
            )
          : (
            // ── Vista de búsqueda ─────────────────────────────────────────────
              <div className="space-y-2">
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Nombre, código de barras o SKU..."
                  className="text-base"
                />

                <div className="max-h-72 overflow-y-auto rounded-md border">
                  {loading && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Cargando productos...
                    </div>
                  )}

                  {!loading && filtered.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {query ? 'Sin resultados' : 'Escribí para buscar'}
                    </div>
                  )}

                  {filtered.map((p, i) => (
                    <div
                      key={p.id}
                      ref={i === highlightedIdx ? highlightedRef : undefined}
                      role="button"
                      tabIndex={-1}
                      className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 transition-colors ${
                        i === highlightedIdx ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => selectProduct(p)}
                      onKeyDown={e => e.key === 'Enter' && selectProduct(p)}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        {p.categoryName && (
                          <p className="truncate text-xs text-muted-foreground">{p.categoryName}</p>
                        )}
                      </div>
                      <p className="shrink-0 font-semibold text-green-600">
                        {formattedPrice(p.price)}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  ↑↓ navegar · Enter seleccionar · Esc cerrar
                </p>
              </div>
            )}
      </DialogContent>
    </Dialog>
  );
}

// Despacha el evento para que POSScreen (si está montado) agregue el producto al carrito.
// El payload se mapea al tipo mínimo que POSScreen necesita.
function windowDispatchAddToCart(product: PriceCheckerProduct) {
  const posProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    promoPrice: null,
    promoName: null,
    promoId: null,
    sku: product.sku,
    barcode: product.barcode,
    imageUrl: product.imageUrl,
    categoryId: null,
    categoryName: product.categoryName,
    stock: null,
  };
  window.dispatchEvent(
    new CustomEvent('price-checker:add-to-cart', { detail: posProduct }),
  );
}
