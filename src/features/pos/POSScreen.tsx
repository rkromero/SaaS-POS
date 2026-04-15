'use client';

import { Maximize2, Minimize2, Package } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Ticket } from './Ticket';

type POSProduct = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  stock: number | null;
};

type CartItem = {
  product: POSProduct;
  quantity: number;
};

type Location = { id: number; name: string };

type CompletedSale = {
  sale: {
    id: number;
    receiptNumber: string;
    customerName: string;
    customerEmail: string | null;
    customerWhatsapp: string | null;
    paymentMethod: string;
    total: string;
    createdAt: string;
  };
  items: {
    id: number;
    productName: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }[];
};

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'debit', label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'fiado', label: 'Fiado' },
];

type FiadoCustomer = {
  id: number;
  name: string;
  whatsapp: string | null;
  email: string | null;
};

type POSScreenProps = {
  orgName: string;
};

export const POSScreen = ({ orgName }: POSScreenProps) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(false);

  // Fullscreen
  const posRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Barcode scanner: track rapid keypresses
  const searchRef = useRef<HTMLInputElement>(null);
  const lastKeyTime = useRef<number>(0);
  const barcodeBuffer = useRef<string>('');

  // Checkout form
  const [customerName, setCustomerName] = useState('Consumidor final');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Fiado: búsqueda de cliente por WhatsApp
  const [fiadoPhone, setFiadoPhone] = useState('');
  const [fiadoSearching, setFiadoSearching] = useState(false);
  const [fiadoCustomer, setFiadoCustomer] = useState<FiadoCustomer | null>(null);
  const [fiadoNotFound, setFiadoNotFound] = useState(false);

  // Ticket modal
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);

  // ARCA facturación
  const [arcaActive, setArcaActive] = useState(false);
  const [emitirFactura, setEmitirFactura] = useState(false);
  const [buyerType, setBuyerType] = useState<'consumidor_final' | 'con_cuit'>('consumidor_final');
  const [buyerCuit, setBuyerCuit] = useState('');

  // Escucha cambios de fullscreen (también el ESC del browser)
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      posRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Load ARCA config
  useEffect(() => {
    fetch('/api/arca/config')
      .then(r => r.json())
      .then((data: any) => {
        if (data?.isActive) {
          setArcaActive(true);
        }
      })
      .catch(() => {});
  }, []);

  // Load locations
  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then((data: any[]) => {
        const active = data.filter(l => l.isActive);
        setLocations(active);
        if (active.length > 0) {
          setSelectedLocationId(String(active[0]!.id));
        }
      });
  }, []);

  // Load products for selected location.
  // force=true omite el caché del browser (se usa después de completar una venta
  // para mostrar el stock actualizado).
  const fetchProducts = useCallback(async (force = false) => {
    if (!selectedLocationId) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/pos/products?locationId=${selectedLocationId}`,
        force ? { cache: 'no-store' } : undefined,
      );
      const data = await res.json();
      setProducts(data);
      setTimeout(() => searchRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Cart operations
  const addToCart = (product: POSProduct) => {
    setCart((prev) => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== productId));
    } else {
      setCart(prev =>
        prev.map(i =>
          i.product.id === productId ? { ...i, quantity } : i,
        ),
      );
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  // Category list from products
  const categories = [...new Map(
    products
      .filter(p => p.categoryId && p.categoryName)
      .map(p => [p.categoryId, { id: p.categoryId!, name: p.categoryName! }]),
  ).values()];

  const filteredProducts = products.filter((p) => {
    const matchSearch
      = search === ''
      || p.name.toLowerCase().includes(search.toLowerCase())
      || (p.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCategory
      = filterCategory === '' || String(p.categoryId) === filterCategory;
    return matchSearch && matchCategory;
  });

  const searchFiadoCustomer = async (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) {
      setFiadoCustomer(null);
      setFiadoNotFound(false);
      return;
    }
    setFiadoSearching(true);
    setFiadoNotFound(false);
    try {
      const res = await fetch(`/api/customers/search?whatsapp=${encodeURIComponent(digits)}`);
      const data = await res.json();
      if (data && data.id) {
        setFiadoCustomer(data);
        setFiadoNotFound(false);
      } else {
        setFiadoCustomer(null);
        setFiadoNotFound(true);
      }
    } catch {
      setFiadoCustomer(null);
    } finally {
      setFiadoSearching(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      return;
    }

    // Validación extra para fiado
    if (paymentMethod === 'fiado') {
      if (!fiadoCustomer) {
        setCheckoutError('Buscá y seleccioná un cliente por WhatsApp para registrar el fiado');
        return;
      }
    } else if (!customerName.trim()) {
      setCheckoutError('El nombre del cliente es requerido');
      return;
    }

    setCheckoutError('');
    setSubmitting(true);

    // Para fiado, usamos los datos del cliente encontrado
    const effectiveCustomerName = paymentMethod === 'fiado' ? fiadoCustomer!.name : customerName;
    const effectiveCustomerWhatsapp = paymentMethod === 'fiado' ? fiadoCustomer!.whatsapp : customerWhatsapp;
    const effectiveCustomerId = paymentMethod === 'fiado' ? fiadoCustomer!.id : undefined;

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: Number(selectedLocationId),
          items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          customerName: effectiveCustomerName,
          customerEmail: paymentMethod === 'fiado' ? (fiadoCustomer!.email || null) : (customerEmail || null),
          customerWhatsapp: effectiveCustomerWhatsapp || null,
          paymentMethod,
          ...(effectiveCustomerId !== undefined && { customerId: effectiveCustomerId }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setCheckoutError(data.error ?? 'Error al registrar la venta');
        return;
      }

      const data: CompletedSale = await response.json();

      // Si el usuario eligió emitir factura, llamar a ARCA
      if (emitirFactura && arcaActive) {
        try {
          const invoiceRes = await fetch('/api/arca/invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              saleId: data.sale.id,
              buyerType,
              buyerCuit: buyerType === 'con_cuit' ? buyerCuit : undefined,
            }),
          });
          if (invoiceRes.ok) {
            const invoiceData = await invoiceRes.json();
            setCompletedSale({
              ...data,
              sale: { ...data.sale, ...invoiceData },
            });
          } else {
            // Venta OK pero factura falló — mostrar igualmente
            setCompletedSale(data);
            setCheckoutError('Venta registrada, pero hubo un error al emitir la factura ARCA.');
          }
        } catch {
          setCompletedSale(data);
          setCheckoutError('Venta registrada, pero no se pudo conectar con ARCA.');
        }
      } else {
        setCompletedSale(data);
      }
    } catch {
      setCheckoutError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSale = () => {
    setCompletedSale(null);
    setCart([]);
    setCustomerName('Consumidor final');
    setCustomerEmail('');
    setCustomerWhatsapp('');
    setPaymentMethod('cash');
    setCheckoutError('');
    setFiadoPhone('');
    setFiadoCustomer(null);
    setFiadoNotFound(false);
    setEmitirFactura(false);
    setBuyerType('consumidor_final');
    setBuyerCuit('');
    fetchProducts(true); // fuerza refetch para mostrar stock actualizado tras la venta
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  // Barcode scanner: detect rapid input (chars < 80ms apart) followed by Enter
  // Hardware scanners type the full barcode in < 100ms total
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();
    const timeDiff = now - lastKeyTime.current;
    lastKeyTime.current = now;

    if (e.key === 'Enter') {
      const sku = barcodeBuffer.current || search;
      barcodeBuffer.current = '';

      if (!sku.trim()) {
        return;
      }

      // Si los chars llegaron muy rápido (pistola lectora), busca por barcode o SKU
      if (timeDiff < 80) {
        const code = sku.trim().toLowerCase();
        const match = products.find(
          p =>
            p.barcode?.toLowerCase() === code
            || p.sku?.toLowerCase() === code,
        );
        if (match) {
          addToCart(match);
          setSearch('');
          e.preventDefault();
          return;
        }
      }

      // Normal Enter: if only one product matches, add it
      if (filteredProducts.length === 1 && filteredProducts[0]) {
        addToCart(filteredProducts[0]);
        setSearch('');
      }
      return;
    }

    // Accumulate barcode buffer when keys arrive fast
    if (timeDiff < 80 && e.key.length === 1) {
      barcodeBuffer.current += e.key;
    } else {
      barcodeBuffer.current = e.key.length === 1 ? e.key : '';
    }
  };

  if (locations.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        No hay locales activos. Creá un local en la sección Locales.
      </div>
    );
  }

  return (
    // posRef apunta al contenedor que se va a fullscreen.
    // En modo fullscreen, el div ocupa h-screen con su propio fondo y padding.
    <div
      ref={posRef}
      className={isFullscreen ? 'flex h-screen flex-col gap-3 bg-background p-4' : ''}
    >
      {/* Barra superior interna — solo visible en fullscreen */}
      {isFullscreen && (
        <div className="flex shrink-0 items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground">
            {orgName}
            {' '}
            — POS
          </span>
          <Button size="sm" variant="outline" onClick={toggleFullscreen}>
            <Minimize2 className="mr-1.5 size-3.5" />
            Salir de pantalla completa
          </Button>
        </div>
      )}

      <div className={`flex gap-4 ${isFullscreen ? 'min-h-0 flex-1' : 'h-[calc(100vh-130px)]'}`}>
        {/* LEFT — Product grid */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          {/* Location + search bar */}
          <div className="flex flex-wrap gap-2">
            {locations.length > 1 && (
              <select
                value={selectedLocationId}
                onChange={e => setSelectedLocationId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            )}

            <Input
              ref={searchRef}
              className="flex-1"
              placeholder="Buscar o escanear código de barras..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Botón fullscreen */}
            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="h-9 px-2.5"
            >
              {isFullscreen
                ? <Minimize2 className="size-4" />
                : <Maximize2 className="size-4" />}
            </Button>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto">
            {loading
              ? <p className="text-sm text-muted-foreground">Cargando productos...</p>
              : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {filteredProducts.map((product) => {
                      const inCart = cart.find(i => i.product.id === product.id);
                      const outOfStock = (product.stock ?? 0) === 0;

                      return (
                        <button
                          key={product.id}
                          type="button"
                          disabled={outOfStock}
                          onClick={() => addToCart(product)}
                          className={`relative flex items-start gap-2 rounded-lg border bg-card p-2 text-left shadow-sm transition-all hover:shadow-md active:scale-95 ${
                            outOfStock ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-primary'
                          } ${inCart ? 'border-primary ring-1 ring-primary' : ''}`}
                        >
                          {/* Contador en carrito */}
                          {inCart && (
                            <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                              {inCart.quantity}
                            </span>
                          )}

                          {/* Imagen del producto o placeholder */}
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                            {product.imageUrl
                              ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="size-full object-cover"
                                    onError={(e) => {
                                      // Si la URL falla, mostrar el placeholder
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      const parent = (e.target as HTMLImageElement).parentElement;
                                      if (parent) {
                                        parent.innerHTML = `<div class="flex size-full items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/40"><path d="M11 21H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h5l2 3h9a2 2 0 0 1 2 2v2"/><path d="M22 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/><path d="M22 22l-3-3"/><circle cx="15" cy="15" r="6"/></svg></div>`;
                                      }
                                    }}
                                  />
                                )
                              : (
                                  <div className="flex size-full items-center justify-center">
                                    <Package className="size-5 text-muted-foreground/40" />
                                  </div>
                                )}
                          </div>

                          {/* Info del producto */}
                          <div className="min-w-0 flex-1">
                            {product.categoryName && (
                              <Badge variant="secondary" className="mb-1 max-w-full truncate text-xs">
                                {product.categoryName}
                              </Badge>
                            )}
                            <p className="line-clamp-2 text-xs font-medium leading-tight">
                              {product.name}
                            </p>
                            <p className="mt-1 text-sm font-bold text-primary">
                              $
                              {Number(product.price).toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                            {outOfStock && (
                              <p className="text-xs text-destructive">Sin stock</p>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <p className="col-span-full text-sm text-muted-foreground">
                        Sin productos para mostrar.
                      </p>
                    )}
                  </div>
                )}
          </div>
        </div>

        {/* RIGHT — Cart + checkout */}
        <div className="flex w-80 flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="font-semibold">Carrito</h2>

          {/* Cart items */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {cart.length === 0
              ? (
                  <p className="text-sm text-muted-foreground">
                    Tocá un producto para agregarlo.
                  </p>
                )
              : cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{item.product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      $
                      {Number(item.product.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="size-6 p-0 text-xs"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      −
                    </Button>
                    <span className="w-5 text-center text-sm">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="size-6 p-0 text-xs"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <span className="w-16 text-right text-sm font-semibold">
                    $
                    {(Number(item.product.price) * item.quantity).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
          </div>

          {/* Customer + payment */}
          {cart.length > 0 && (
            <div className="space-y-3 border-t pt-3">
              {/* Campos de cliente: ocultos cuando se selecciona fiado */}
              {paymentMethod !== 'fiado' && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="customerName">Cliente *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Nombre del cliente"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="customerEmail" className="text-xs">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        className="text-xs"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        placeholder="opcional"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="customerWhatsapp" className="text-xs">WhatsApp</Label>
                      <Input
                        id="customerWhatsapp"
                        className="text-xs"
                        value={customerWhatsapp}
                        onChange={e => setCustomerWhatsapp(e.target.value)}
                        placeholder="opcional"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Búsqueda de cliente por WhatsApp cuando el pago es fiado */}
              {paymentMethod === 'fiado' && (
                <div className="space-y-2">
                  <Label htmlFor="fiadoPhone">WhatsApp del cliente *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fiadoPhone"
                      className="flex-1"
                      value={fiadoPhone}
                      onChange={e => setFiadoPhone(e.target.value)}
                      placeholder="Ej: 1123456789"
                      onBlur={() => searchFiadoCustomer(fiadoPhone)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          searchFiadoCustomer(fiadoPhone);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={fiadoSearching}
                      onClick={() => searchFiadoCustomer(fiadoPhone)}
                    >
                      {fiadoSearching ? '...' : 'Buscar'}
                    </Button>
                  </div>

                  {/* Cliente encontrado */}
                  {fiadoCustomer && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-800 dark:bg-green-950">
                      <p className="font-medium text-green-800 dark:text-green-200">{fiadoCustomer.name}</p>
                      {fiadoCustomer.whatsapp && (
                        <p className="text-xs text-green-600 dark:text-green-400">{fiadoCustomer.whatsapp}</p>
                      )}
                    </div>
                  )}

                  {/* Cliente no encontrado */}
                  {fiadoNotFound && !fiadoCustomer && (
                    <p className="text-xs text-destructive">
                      Cliente no encontrado. Registralo primero en la sección Fiado.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <Label>Método de pago</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(pm.value);
                        // Al salir de fiado, limpiar el estado de búsqueda
                        if (pm.value !== 'fiado') {
                          setFiadoPhone('');
                          setFiadoCustomer(null);
                          setFiadoNotFound(false);
                        }
                      }}
                      className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                        paymentMethod === pm.value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ARCA — factura electrónica */}
              {arcaActive && (
                <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="emitirFactura"
                      checked={emitirFactura}
                      onChange={e => setEmitirFactura(e.target.checked)}
                      className="size-4"
                    />
                    <Label htmlFor="emitirFactura" className="cursor-pointer text-sm font-medium">
                      Emitir factura electrónica (ARCA)
                    </Label>
                  </div>
                  {emitirFactura && (
                    <div className="space-y-2 pl-6">
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { value: 'consumidor_final', label: 'Consumidor Final' },
                          { value: 'con_cuit', label: 'Con CUIT' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setBuyerType(opt.value as any)}
                            className={`rounded border px-2 py-1.5 text-xs font-medium transition-colors ${
                              buyerType === opt.value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'bg-background hover:bg-muted'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {buyerType === 'con_cuit' && (
                        <Input
                          value={buyerCuit}
                          onChange={e => setBuyerCuit(e.target.value)}
                          placeholder="CUIT del comprador"
                          className="h-8 font-mono text-xs"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Total + confirm */}
              <div className="border-t pt-2">
                <div className="mb-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>
                    $
                    {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {checkoutError && (
                  <p className="mb-2 text-xs text-destructive">{checkoutError}</p>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={submitting || cart.length === 0}
                  onClick={handleCheckout}
                >
                  {submitting ? 'Procesando...' : 'Confirmar venta'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ticket modal */}
      {completedSale && (
        <Ticket
          sale={completedSale.sale}
          items={completedSale.items}
          locationName={locations.find(l => String(l.id) === selectedLocationId)?.name ?? ''}
          orgName={orgName}
          onClose={handleNewSale}
        />
      )}
    </div>
  );
};
