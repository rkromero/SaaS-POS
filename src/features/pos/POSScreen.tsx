'use client';

import { Maximize2, Minimize2, Package, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { LoyaltyCustomerPanel } from '../loyalty/LoyaltyCustomerPanel';
import { Ticket } from './Ticket';

type POSProduct = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  // Set when an active product_price promo applies
  promoPrice: string | null;
  promoName: string | null;
  promoId: number | null;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  stock: number | null;
};

type POSCombo = {
  id: number;
  name: string;
  description: string | null;
  comboPrice: string;
  isStackable: boolean;
  items: { productId: number; productName: string; quantity: number; stock: number | null }[];
};

type ActivePromoDiscount = {
  id: number;
  name: string;
  isStackable: boolean;
  discountType: 'percent' | 'fixed' | null;
  discountValue: string | null;
  discountScope: 'product' | 'category' | 'total' | null;
  targetProductId: number | null;
  targetCategoryId: number | null;
};

type CartItem =
  | { type: 'product'; product: POSProduct; quantity: number }
  | { type: 'combo'; combo: POSCombo; quantity: number };

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
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'fiado', label: 'Fiado' },
];

const MERCADOPAGO_IDX = PAYMENT_METHODS.findIndex(pm => pm.value === 'mercadopago');

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
  const [combos, setCombos] = useState<POSCombo[]>([]);
  const [activePromoDiscounts, setActivePromoDiscounts] = useState<ActivePromoDiscount[]>([]);
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
  const lastEnterTime = useRef<number>(0);
  // Ref estable para openCheckoutFlow, permite usarlo en el listener global sin problemas de orden
  const handleCheckoutRef = useRef<() => void>(() => {});
  // Refs para el foco de los modales del flujo de cobro
  const modalLoyaltyInputRef = useRef<HTMLInputElement>(null);
  const modalPaymentListRef = useRef<HTMLDivElement>(null);

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

  // Loyalty — fidelización de clientes
  const [loyaltyActive, setLoyaltyActive] = useState(false);
  const [loyaltyCustomerId, setLoyaltyCustomerId] = useState<number | null>(null);
  const [loyaltyRewardId, setLoyaltyRewardId] = useState<number | null>(null);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);

  // Flujo de cobro por teclado: 'idle' → 'loyalty' → 'payment' → checkout
  const [checkoutFlowStep, setCheckoutFlowStep] = useState<'idle' | 'loyalty' | 'payment'>('idle');
  const [modalLoyaltyPhone, setModalLoyaltyPhone] = useState('');
  const [modalLoyaltySearching, setModalLoyaltySearching] = useState(false);
  const [modalLoyaltyError, setModalLoyaltyError] = useState('');
  const [modalPaymentIdx, setModalPaymentIdx] = useState(MERCADOPAGO_IDX);

  // Escucha cambios de fullscreen (también el ESC del browser)
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // Listener global: doble Enter abre el flujo de cobro; Escape cierra cualquier modal activo
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Escape: cancelar el flujo de cobro si hay un modal abierto
      if (e.key === 'Escape' && checkoutFlowStep !== 'idle') {
        e.preventDefault();
        // cancelCheckoutFlow no está disponible aquí por hoisting, seteamos directo
        setCheckoutFlowStep('idle');
        setModalLoyaltyPhone('');
        setModalLoyaltyError('');
        return;
      }

      // Mientras el flujo de cobro esté activo, el modal maneja sus propias teclas
      if (checkoutFlowStep !== 'idle') {
        return;
      }

      if (e.key !== 'Enter') {
        return;
      }
      // Ignorar si el foco está en un input/textarea/select (esos tienen su propio comportamiento)
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      const now = Date.now();
      const sinceLastEnter = now - lastEnterTime.current;
      lastEnterTime.current = now;

      if (sinceLastEnter < 500) {
        e.preventDefault();
        handleCheckoutRef.current();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [checkoutFlowStep]);

  // Foco automático cuando se abre un modal del flujo de cobro
  useEffect(() => {
    if (checkoutFlowStep === 'loyalty') {
      setTimeout(() => modalLoyaltyInputRef.current?.focus(), 50);
    } else if (checkoutFlowStep === 'payment') {
      setTimeout(() => modalPaymentListRef.current?.focus(), 50);
    }
  }, [checkoutFlowStep]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      posRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Load ARCA config + loyalty config en paralelo
  useEffect(() => {
    Promise.all([
      fetch('/api/arca/config').then(r => r.json()).catch(() => null),
      fetch('/api/loyalty/config').then(r => r.json()).catch(() => null),
    ]).then(([arca, loyalty]) => {
      if (arca?.isActive) {
        setArcaActive(true);
      }
      if (loyalty?.isActive) {
        setLoyaltyActive(true);
      }
    });
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
      // API returns { products, combos, promotions } when module is enabled, or products[] otherwise
      if (Array.isArray(data)) {
        setProducts(data);
        setCombos([]);
        setActivePromoDiscounts([]);
      } else {
        setProducts(data.products ?? []);
        setCombos(data.combos ?? []);
        setActivePromoDiscounts(data.promotions ?? []);
      }
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
      const existing = prev.find(i => i.type === 'product' && i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.type === 'product' && i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { type: 'product' as const, product, quantity: 1 }];
    });
  };

  const addComboToCart = (combo: POSCombo) => {
    // Verify each component has enough stock considering what's already in the cart
    for (const component of combo.items) {
      const available = component.stock ?? 0;
      const usedByProducts = cart
        .filter(i => i.type === 'product' && i.product.id === component.productId)
        .reduce((s, i) => s + i.quantity, 0);
      const usedByCombos = cart
        .filter(i => i.type === 'combo')
        .reduce((s, i) => {
          const found = (i as { type: 'combo'; combo: POSCombo; quantity: number }).combo.items.find(
            ci => ci.productId === component.productId,
          );
          return s + (found ? found.quantity * i.quantity : 0);
        }, 0);
      const alreadyInComboCart = cart
        .filter(i => i.type === 'combo' && (i as { type: 'combo'; combo: POSCombo; quantity: number }).combo.id === combo.id)
        .reduce((s, i) => s + i.quantity, 0);
      const needed = component.quantity * (alreadyInComboCart + 1);
      if (usedByProducts + usedByCombos - (component.quantity * alreadyInComboCart) + needed > available) {
        setCheckoutError(`Stock insuficiente para "${component.productName}" en el combo "${combo.name}".`);
        return;
      }
    }
    setCheckoutError('');
    setCart((prev) => {
      const existing = prev.find(i => i.type === 'combo' && (i as { type: 'combo'; combo: POSCombo; quantity: number }).combo.id === combo.id);
      if (existing) {
        return prev.map(i =>
          i.type === 'combo' && (i as { type: 'combo'; combo: POSCombo; quantity: number }).combo.id === combo.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { type: 'combo' as const, combo, quantity: 1 }];
    });
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter((i) => {
        const itemKey = i.type === 'product' ? `p-${i.product.id}` : `c-${(i as { type: 'combo'; combo: POSCombo; quantity: number }).combo.id}`;
        return itemKey !== key;
      }));
    } else {
      setCart(prev =>
        prev.map((i) => {
          const itemKey = i.type === 'product' ? `p-${i.product.id}` : `c-${(i as { type: 'combo'; combo: POSCombo; quantity: number }).combo.id}`;
          return itemKey === key ? { ...i, quantity } : i;
        }),
      );
    }
  };

  // Compute applicable discount from active promo discounts (preview; backend is authoritative)
  const computePromoDiscount = (subtotal: number): number => {
    if (activePromoDiscounts.length === 0) {
      return 0;
    }

    const withAmounts = activePromoDiscounts.map((promo) => {
      const val = Number(promo.discountValue ?? 0);
      if (promo.discountScope === 'total') {
        return {
          promo,
          amount: promo.discountType === 'percent' ? subtotal * (val / 100) : Math.min(val, subtotal),
        };
      }
      if (promo.discountScope === 'product') {
        const item = cart.find(i => i.type === 'product' && i.product.id === promo.targetProductId);
        if (!item || item.type !== 'product') {
          return { promo, amount: 0 };
        }
        const base = Number(item.product.promoPrice ?? item.product.price) * item.quantity;
        return {
          promo,
          amount: promo.discountType === 'percent' ? base * (val / 100) : Math.min(val * item.quantity, base),
        };
      }
      if (promo.discountScope === 'category') {
        const categoryItems = cart.filter(
          i => i.type === 'product' && i.product.categoryId === promo.targetCategoryId,
        );
        if (categoryItems.length === 0) {
          return { promo, amount: 0 };
        }
        const base = categoryItems.reduce((s, i) => {
          if (i.type !== 'product') {
            return s;
          }
          return s + Number(i.product.promoPrice ?? i.product.price) * i.quantity;
        }, 0);
        return {
          promo,
          amount: promo.discountType === 'percent' ? base * (val / 100) : Math.min(val * categoryItems.length, base),
        };
      }
      return { promo, amount: 0 };
    }).filter(x => x.amount > 0);

    if (withAmounts.length === 0) {
      return 0;
    }
    const hasNonStackable = withAmounts.some(x => !x.promo.isStackable);
    return hasNonStackable
      ? Math.max(...withAmounts.map(x => x.amount))
      : withAmounts.reduce((s, x) => s + x.amount, 0);
  };

  const rawTotal = cart.reduce((sum, item) => {
    if (item.type === 'combo') {
      return sum + Number((item as { type: 'combo'; combo: POSCombo; quantity: number }).combo.comboPrice) * item.quantity;
    }
    const p = (item as { type: 'product'; product: POSProduct; quantity: number }).product;
    return sum + Number(p.promoPrice ?? p.price) * item.quantity;
  }, 0);

  const promoDiscount = computePromoDiscount(rawTotal);
  const total = Math.max(0, rawTotal - promoDiscount - loyaltyDiscount);

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

  // Combos shown alongside products when no category filter is active (or always when searching)
  const filteredCombos = filterCategory === ''
    ? combos.filter(c => search === '' || c.name.toLowerCase().includes(search.toLowerCase()))
    : [];

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

  const handleCheckout = useCallback(async (overridePaymentMethod?: string) => {
    if (cart.length === 0) {
      return;
    }

    const effectivePm = overridePaymentMethod ?? paymentMethod;

    // Validación extra para fiado
    if (effectivePm === 'fiado') {
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
    const effectiveCustomerName = effectivePm === 'fiado' ? fiadoCustomer!.name : customerName;
    const effectiveCustomerWhatsapp = effectivePm === 'fiado' ? fiadoCustomer!.whatsapp : customerWhatsapp;
    const effectiveCustomerId = effectivePm === 'fiado' ? fiadoCustomer!.id : undefined;

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: Number(selectedLocationId),
          items: cart
            .filter(i => i.type === 'product')
            .map(i => ({ productId: (i as { type: 'product'; product: POSProduct; quantity: number }).product.id, quantity: i.quantity })),
          comboItems: cart
            .filter(i => i.type === 'combo')
            .map(i => ({ comboId: (i as { type: 'combo'; combo: POSCombo; quantity: number }).combo.id, quantity: i.quantity })),
          customerName: effectiveCustomerName,
          customerEmail: effectivePm === 'fiado' ? (fiadoCustomer!.email || null) : (customerEmail || null),
          customerWhatsapp: effectiveCustomerWhatsapp || null,
          paymentMethod: effectivePm,
          ...(effectiveCustomerId !== undefined && { customerId: effectiveCustomerId }),
          // Loyalty
          ...(loyaltyCustomerId && { loyaltyCustomerId }),
          ...(loyaltyRewardId && { loyaltyRewardId }),
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
  }, [cart, paymentMethod, fiadoCustomer, customerName, customerEmail, customerWhatsapp, selectedLocationId, loyaltyCustomerId, loyaltyRewardId, emitirFactura, arcaActive, buyerType, buyerCuit]);

  // openCheckoutFlow: abre el flujo de cobro por teclado (Modal 1 → Modal 2 → checkout)
  const openCheckoutFlow = useCallback(() => {
    if (cart.length === 0 || submitting) {
      return;
    }
    setModalLoyaltyPhone('');
    setModalLoyaltyError('');
    setModalPaymentIdx(MERCADOPAGO_IDX >= 0 ? MERCADOPAGO_IDX : 0);
    setCheckoutFlowStep(loyaltyActive ? 'loyalty' : 'payment');
  }, [cart.length, submitting, loyaltyActive]);

  // handleLoyaltyModalSubmit: busca o crea el cliente por WhatsApp y avanza al Modal 2
  const handleLoyaltyModalSubmit = useCallback(async () => {
    const digits = modalLoyaltyPhone.replace(/\D/g, '');
    if (!digits || digits.length < 6) {
      // Sin teléfono: avanzar sin asignar cliente de fidelización
      setCheckoutFlowStep('payment');
      return;
    }
    setModalLoyaltySearching(true);
    setModalLoyaltyError('');
    try {
      const res = await fetch(`/api/customers/search?whatsapp=${encodeURIComponent(digits)}`);
      const customer = await res.json();
      let cid: number;
      if (customer?.id) {
        cid = customer.id;
        setCustomerWhatsapp(customer.whatsapp ?? digits);
        if (customer.name && customer.name !== 'Consumidor final') {
          setCustomerName(customer.name);
        }
      } else {
        // Cliente no existe: crearlo con el teléfono como nombre provisional
        const cr = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: digits, whatsapp: digits }),
        });
        if (!cr.ok) {
          const err = await cr.json();
          setModalLoyaltyError(err.error ?? 'Error al registrar el cliente');
          return;
        }
        const nc = await cr.json();
        cid = nc.id;
        setCustomerWhatsapp(digits);
      }
      setLoyaltyCustomerId(cid);
      setCheckoutFlowStep('payment');
    } catch {
      setModalLoyaltyError('Error de conexión');
    } finally {
      setModalLoyaltySearching(false);
    }
  }, [modalLoyaltyPhone]);

  const cancelCheckoutFlow = useCallback(() => {
    setCheckoutFlowStep('idle');
    setModalLoyaltyPhone('');
    setModalLoyaltyError('');
  }, []);

  // El ref siempre apunta a openCheckoutFlow para el listener global de doble Enter
  handleCheckoutRef.current = openCheckoutFlow;

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
    setLoyaltyCustomerId(null);
    setLoyaltyRewardId(null);
    setLoyaltyDiscount(0);
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
      const now2 = Date.now();
      const sinceLastEnter = now2 - lastEnterTime.current;
      lastEnterTime.current = now2;

      // Doble Enter (< 500ms entre dos Enter): abrir flujo de cobro si hay carrito
      if (sinceLastEnter < 500 && cart.length > 0 && !submitting) {
        e.preventDefault();
        barcodeBuffer.current = '';
        openCheckoutFlow();
        return;
      }

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
                      const inCart = cart.find(i => i.type === 'product' && (i as { type: 'product'; product: POSProduct; quantity: number }).product.id === product.id);
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
                            {product.promoPrice
                              ? (
                                  <div className="mt-1 space-y-0.5">
                                    <p className="text-xs text-muted-foreground line-through">
                                      $
                                      {Number(product.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-sm font-bold text-emerald-600">
                                      $
                                      {Number(product.promoPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[9px] font-semibold uppercase text-emerald-500">
                                      {product.promoName}
                                    </p>
                                  </div>
                                )
                              : (
                                  <p className="mt-1 text-sm font-bold text-primary">
                                    $
                                    {Number(product.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                  </p>
                                )}
                            {outOfStock && (
                              <p className="text-xs text-destructive">Sin stock</p>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {filteredProducts.length === 0 && filteredCombos.length === 0 && (
                      <p className="col-span-full text-sm text-muted-foreground">
                        Sin productos para mostrar.
                      </p>
                    )}

                    {/* Combo cards */}
                    {filteredCombos.map((combo) => {
                      const inCart = cart.find(
                        i => i.type === 'combo' && (i as { type: 'combo'; combo: POSCombo; quantity: number }).combo.id === combo.id,
                      );
                      const hasStock = combo.items.every(c => (c.stock ?? 0) >= c.quantity);

                      return (
                        <button
                          key={`combo-${combo.id}`}
                          type="button"
                          disabled={!hasStock}
                          onClick={() => addComboToCart(combo)}
                          className={`relative flex flex-col rounded-lg border bg-card p-3 text-left shadow-sm transition-all hover:shadow-md active:scale-95 ${
                            !hasStock ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-violet-500'
                          } ${inCart ? 'border-violet-500 ring-1 ring-violet-500' : 'border-violet-900/40'}`}
                        >
                          {inCart && (
                            <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                              {inCart.quantity}
                            </span>
                          )}
                          <span className="mb-1.5 self-start rounded bg-violet-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-violet-300">
                            Combo
                          </span>
                          <p className="line-clamp-2 text-xs font-medium leading-tight text-zinc-200">
                            {combo.name}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {combo.items.map(i => `${i.quantity}x ${i.productName}`).join(' + ')}
                          </p>
                          <p className="mt-1.5 text-sm font-bold text-violet-400">
                            $
                            {Number(combo.comboPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                          {!hasStock && (
                            <p className="text-xs text-destructive">Sin stock</p>
                          )}
                        </button>
                      );
                    })}
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
              : cart.map((item) => {
                const isCombo = item.type === 'combo';
                const label = isCombo
                  ? (item as { type: 'combo'; combo: POSCombo; quantity: number }).combo.name
                  : (item as { type: 'product'; product: POSProduct; quantity: number }).product.name;
                const unitPrice = isCombo
                  ? Number((item as { type: 'combo'; combo: POSCombo; quantity: number }).combo.comboPrice)
                  : Number(
                    (item as { type: 'product'; product: POSProduct; quantity: number }).product.promoPrice
                    ?? (item as { type: 'product'; product: POSProduct; quantity: number }).product.price,
                  );
                const origPrice = isCombo
                  ? null
                  : (item as { type: 'product'; product: POSProduct; quantity: number }).product.promoPrice
                      ? Number((item as { type: 'product'; product: POSProduct; quantity: number }).product.price)
                      : null;
                const itemKey = isCombo
                  ? `c-${(item as { type: 'combo'; combo: POSCombo; quantity: number }).combo.id}`
                  : `p-${(item as { type: 'product'; product: POSProduct; quantity: number }).product.id}`;

                return (
                  <div key={itemKey} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        {isCombo && (
                          <span className="shrink-0 rounded bg-violet-900 px-1 py-0.5 text-[9px] font-semibold uppercase text-violet-300">
                            Combo
                          </span>
                        )}
                        <span className="truncate text-sm font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {origPrice !== null && (
                          <span className="line-through opacity-50">
                            $
                            {origPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        <span className={origPrice !== null ? 'font-medium text-emerald-500' : ''}>
                          $
                          {unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="size-6 p-0 text-xs"
                        onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                      >
                        −
                      </Button>
                      <span className="w-5 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="size-6 p-0 text-xs"
                        onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <span className="w-16 text-right text-sm font-semibold">
                      $
                      {(unitPrice * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
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

              {/* Loyalty — fidelización de clientes */}
              {loyaltyActive && (
                <LoyaltyCustomerPanel
                  cartTotal={rawTotal}
                  onCustomerChange={id => setLoyaltyCustomerId(id)}
                  onRewardChange={(rewardId, discount) => {
                    setLoyaltyRewardId(rewardId);
                    setLoyaltyDiscount(discount);
                  }}
                />
              )}

              {/* Descuento de promociones */}
              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-indigo-500">
                  <span>Descuento promoción</span>
                  <span>
                    -$
                    {promoDiscount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Descuento de fidelización aplicado */}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento fidelización</span>
                  <span>
                    -$
                    {loyaltyDiscount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

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
                  onClick={openCheckoutFlow}
                >
                  {submitting ? 'Procesando...' : 'Confirmar venta'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flujo de cobro — Modal 1: teléfono para fidelización */}
      {checkoutFlowStep === 'loyalty' && (
        <div className="fixed inset-0 z-50">
          <div
            role="button"
            tabIndex={-1}
            aria-label="Cancelar"
            className="absolute inset-0 bg-black/60"
            onClick={cancelCheckoutFlow}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                cancelCheckoutFlow();
              }
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="relative z-10 w-full max-w-sm rounded-xl border bg-card p-6 shadow-2xl">
              <div className="mb-3 flex items-center gap-2">
                <Star className="size-5 fill-amber-400 text-amber-400" />
                <h2 className="text-base font-semibold">Puntos de fidelización</h2>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Ingresá el WhatsApp del cliente para sumarle puntos.
                Dejá vacío para saltear.
              </p>
              <Input
                ref={modalLoyaltyInputRef}
                value={modalLoyaltyPhone}
                onChange={e => setModalLoyaltyPhone(e.target.value)}
                placeholder="Ej: 1123456789"
                disabled={modalLoyaltySearching}
                className="text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLoyaltyModalSubmit();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setCheckoutFlowStep('idle');
                    setModalLoyaltyPhone('');
                    setModalLoyaltyError('');
                  }
                }}
              />
              {modalLoyaltySearching && (
                <p className="mt-2 text-xs text-muted-foreground">Buscando cliente...</p>
              )}
              {modalLoyaltyError && (
                <p className="mt-2 text-xs text-destructive">{modalLoyaltyError}</p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">Enter</kbd>
                {' '}
                continuar
                {' · '}
                <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">Esc</kbd>
                {' '}
                cancelar
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Flujo de cobro — Modal 2: método de pago */}
      {checkoutFlowStep === 'payment' && (
        <div className="fixed inset-0 z-50">
          <div
            role="button"
            tabIndex={-1}
            aria-label="Cancelar"
            className="absolute inset-0 bg-black/60"
            onClick={() => setCheckoutFlowStep('idle')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setCheckoutFlowStep('idle');
              }
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            {/* El div de diálogo necesita tabIndex y onKeyDown para navegación por teclado */}
            {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */}
            {/* eslint-disable jsx-a11y/no-noninteractive-tabindex */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Seleccionar método de pago"
              ref={modalPaymentListRef}
              tabIndex={0}
              className="relative z-10 w-full max-w-sm rounded-xl border bg-card p-6 shadow-2xl outline-none"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setModalPaymentIdx(i => Math.min(i + 1, PAYMENT_METHODS.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setModalPaymentIdx(i => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  const pm = PAYMENT_METHODS[modalPaymentIdx];
                  if (pm) {
                    setPaymentMethod(pm.value);
                    setCheckoutFlowStep('idle');
                    handleCheckout(pm.value);
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setCheckoutFlowStep('idle');
                }
              }}
            >
              <h2 className="mb-1 text-base font-semibold">Método de pago</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Total:
                {' '}
                <span className="font-bold text-foreground">
                  $
                  {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </p>
              <div className="space-y-1.5">
                {PAYMENT_METHODS.map((pm, i) => (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(pm.value);
                      setCheckoutFlowStep('idle');
                      handleCheckout(pm.value);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                      i === modalPaymentIdx
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'bg-background hover:bg-muted'
                    }`}
                    onMouseEnter={() => setModalPaymentIdx(i)}
                  >
                    <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                      i === modalPaymentIdx
                        ? 'border-primary-foreground/40 bg-primary-foreground/20 text-primary-foreground'
                        : 'border-muted-foreground/30 text-muted-foreground'
                    }`}
                    >
                      {i + 1}
                    </span>
                    {pm.label}
                    {i === modalPaymentIdx && (
                      <span className="ml-auto text-xs font-normal opacity-70">↵</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                {' '}
                navegar
                {' · '}
                <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">Enter</kbd>
                {' '}
                confirmar
                {' · '}
                <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">Esc</kbd>
                {' '}
                cancelar
              </p>
            </div>
            {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */}
            {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
          </div>
        </div>
      )}

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
