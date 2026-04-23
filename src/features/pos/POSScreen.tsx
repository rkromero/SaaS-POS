'use client';

import { ChevronDown, Maximize2, Minimize2, MoreHorizontal, Package, Plus, Printer, Scan, Settings, ShoppingBasket, Star, UserPlus, WifiOff, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { savePendingSale } from '@/libs/offlineSalesDB';

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

const FRESH_TAB_STATE = {
  cart: [] as CartItem[],
  selectedCustomer: null as FiadoCustomer | null,
  customerName: 'Consumidor final',
  customerEmail: '',
  customerWhatsapp: '',
  paymentMethod: 'cash',
  checkoutError: '',
  fiadoPhone: '',
  fiadoCustomer: null as FiadoCustomer | null,
  fiadoNotFound: false,
  emitirFactura: false,
  buyerType: 'consumidor_final' as 'consumidor_final' | 'con_cuit',
  buyerCuit: '',
  loyaltyCustomerId: null as number | null,
  loyaltyRewardId: null as number | null,
  loyaltyDiscount: 0,
  completedSale: null as CompletedSale | null,
  checkoutFlowStep: 'idle' as 'idle' | 'loyalty' | 'payment',
  modalLoyaltyPhone: '',
  modalLoyaltyError: '',
  modalPaymentIdx: MERCADOPAGO_IDX >= 0 ? MERCADOPAGO_IDX : 0,
  modalFoundCustomer: null as FiadoCustomer | null,
};

type FiadoCustomer = {
  id: number;
  name: string;
  whatsapp: string | null;
  email: string | null;
};

type SaleTab = {
  id: string;
  label: string;
  cart: CartItem[];
  selectedCustomer: FiadoCustomer | null;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  paymentMethod: string;
  checkoutError: string;
  fiadoPhone: string;
  fiadoCustomer: FiadoCustomer | null;
  fiadoNotFound: boolean;
  emitirFactura: boolean;
  buyerType: 'consumidor_final' | 'con_cuit';
  buyerCuit: string;
  loyaltyCustomerId: number | null;
  loyaltyRewardId: number | null;
  loyaltyDiscount: number;
  completedSale: CompletedSale | null;
  checkoutFlowStep: 'idle' | 'loyalty' | 'payment';
  modalLoyaltyPhone: string;
  modalLoyaltyError: string;
  modalPaymentIdx: number;
  modalFoundCustomer: FiadoCustomer | null;
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
  const createProductNameRef = useRef<HTMLInputElement>(null);

  // Checkout form
  const [selectedCustomer, setSelectedCustomer] = useState<FiadoCustomer | null>(null);
  const [customerName, setCustomerName] = useState('Consumidor final');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Producto no encontrado — dialogs de escaneo
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [createProductName, setCreateProductName] = useState('');
  const [createProductPrice, setCreateProductPrice] = useState('');
  const [createProductBarcode, setCreateProductBarcode] = useState('');
  const [createProductImageUrl, setCreateProductImageUrl] = useState('');
  const [createProductSuggestedImage, setCreateProductSuggestedImage] = useState<string | null>(null);
  const [createProductFetchingInfo, setCreateProductFetchingInfo] = useState(false);
  const [createProductError, setCreateProductError] = useState('');
  const [createProductLoading, setCreateProductLoading] = useState(false);
  const createProductBarcodeRef = useRef<HTMLInputElement>(null);
  const createProductBarcodeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Customer selector: búsqueda y creación rápida
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerDropdownResults, setCustomerDropdownResults] = useState<FiadoCustomer[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const customerPortalRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Fiado: búsqueda de cliente por WhatsApp
  const [fiadoPhone, setFiadoPhone] = useState('');
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

  // Offline sync
  const { isOnline, pendingCount, isSyncing, syncPendingSales, refreshCount } = useOfflineSync();

  // Flujo de cobro por teclado: 'idle' → 'loyalty' → 'payment' → checkout
  const [checkoutFlowStep, setCheckoutFlowStep] = useState<'idle' | 'loyalty' | 'payment'>('idle');
  const [modalLoyaltyPhone, setModalLoyaltyPhone] = useState('');
  const [modalLoyaltySearching, setModalLoyaltySearching] = useState(false);
  const [modalLoyaltyError, setModalLoyaltyError] = useState('');
  const [modalPaymentIdx, setModalPaymentIdx] = useState(MERCADOPAGO_IDX);
  // Cliente encontrado/creado en Modal 1 — usado como cliente fiado si se elige ese método
  const [modalFoundCustomer, setModalFoundCustomer] = useState<FiadoCustomer | null>(null);

  // Pestañas de ventas paralelas
  const [saleTabs, setSaleTabs] = useState<SaleTab[]>([
    { id: 'tab-1', label: 'Venta 1', ...FRESH_TAB_STATE },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');

  // Escucha cambios de fullscreen (también el ESC del browser)
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // Click outside para cerrar el dropdown (se verifica tanto el row como el portal)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inRow = customerDropdownRef.current?.contains(target);
      const inPortal = customerPortalRef.current?.contains(target);
      if (!inRow && !inPortal) {
        setCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda debounced de clientes por nombre o teléfono
  useEffect(() => {
    if (customerQuery.length < 2) {
      setCustomerDropdownResults([]);
      setCustomerDropdownOpen(false);
      return;
    }
    // Calcular posición y abrir dropdown inmediatamente (muestra "Buscando..." + "Crear cliente")
    if (customerDropdownRef.current) {
      const rect = customerDropdownRef.current.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setCustomerSearchLoading(true);
    setCustomerDropdownOpen(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(customerQuery)}`);
        const data = await res.json();
        setCustomerDropdownResults(Array.isArray(data) ? data : []);
      } catch {
        setCustomerDropdownResults([]);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerQuery]);

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

  useEffect(() => {
    if (showCreateProduct) {
      setTimeout(() => createProductNameRef.current?.focus(), 50);
    } else {
      // Limpiar al cerrar
      setCreateProductSuggestedImage(null);
      setCreateProductImageUrl('');
      setCreateProductFetchingInfo(false);
    }
  }, [showCreateProduct]);

  // Consulta Open Food Facts cuando el barcode del modal tiene ≥8 chars
  useEffect(() => {
    if (createProductBarcodeDebounce.current) {
      clearTimeout(createProductBarcodeDebounce.current);
    }
    if (!showCreateProduct || createProductBarcode.length < 8) {
      setCreateProductSuggestedImage(null);
      return;
    }
    createProductBarcodeDebounce.current = setTimeout(async () => {
      setCreateProductFetchingInfo(true);
      setCreateProductSuggestedImage(null);
      try {
        const res = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(createProductBarcode)}.json`,
        );
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const img: string | null = data.product.image_front_url ?? data.product.image_url ?? null;
          const offName: string | null = data.product.product_name ?? null;
          if (img) {
            setCreateProductSuggestedImage(img);
          }
          // Auto-completar nombre solo si el campo está vacío
          if (offName && !createProductName.trim()) {
            setCreateProductName(offName);
          }
        }
      } catch {
        // Silencioso
      } finally {
        setCreateProductFetchingInfo(false);
      }
    }, 800);
    return () => {
      if (createProductBarcodeDebounce.current) {
        clearTimeout(createProductBarcodeDebounce.current);
      }
    };
  }, [createProductBarcode, showCreateProduct]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const addToCart = useCallback((product: POSProduct) => {
    setCart((prev) => {
      const existing = prev.find(i => i.type === 'product' && i.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      // Respect stock limit when tracking is enabled (stock !== null)
      if (product.stock !== null && currentQty >= product.stock) {
        return prev;
      }
      if (existing) {
        return prev.map(i =>
          i.type === 'product' && i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { type: 'product' as const, product, quantity: 1 }];
    });
  }, []);

  // Recibe productos desde el consultor de precios global (F10)
  useEffect(() => {
    const handler = (e: Event) => {
      const product = (e as CustomEvent<POSProduct>).detail;
      if (product) {
        addToCart(product);
      }
    };
    window.addEventListener('price-checker:add-to-cart', handler);
    return () => window.removeEventListener('price-checker:add-to-cart', handler);
    // addToCart es estable (no depende de props ni state externo), no necesita ir en deps
  }, []);

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
          if (itemKey !== key) {
            return i;
          }
          // Cap at stock limit for products with stock tracking enabled
          if (i.type === 'product' && i.product.stock !== null) {
            return { ...i, quantity: Math.min(quantity, i.product.stock) };
          }
          return { ...i, quantity };
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

  const handleCheckout = useCallback(async (overridePaymentMethod?: string) => {
    if (cart.length === 0) {
      return;
    }

    const effectivePm = overridePaymentMethod ?? paymentMethod;

    // Para fiado: el cliente seleccionado en el selector tiene prioridad sobre fiadoCustomer/modalFoundCustomer
    const effectiveFiadoCustomer = selectedCustomer ?? fiadoCustomer ?? modalFoundCustomer;

    // Validación extra para fiado
    if (effectivePm === 'fiado') {
      if (!effectiveFiadoCustomer) {
        setCheckoutError('Seleccioná o creá un cliente antes de registrar una venta en fiado');
        return;
      }
    } else if (!customerName.trim()) {
      setCheckoutError('El nombre del cliente es requerido');
      return;
    }

    setCheckoutError('');
    setSubmitting(true);

    // Para fiado usamos los datos del cliente encontrado; si hay selectedCustomer, se usa en cualquier método
    const effectiveCustomerName = effectivePm === 'fiado' ? effectiveFiadoCustomer!.name : customerName;
    const effectiveCustomerWhatsapp = effectivePm === 'fiado' ? effectiveFiadoCustomer!.whatsapp : customerWhatsapp;
    const effectiveCustomerId = effectivePm === 'fiado'
      ? effectiveFiadoCustomer!.id
      : selectedCustomer?.id;

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
          customerEmail: effectivePm === 'fiado' ? (effectiveFiadoCustomer!.email || null) : (customerEmail || null),
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
      if (!navigator.onLine) {
        const offlineId = crypto.randomUUID();
        const locationName = locations.find(l => String(l.id) === selectedLocationId)?.name ?? '';
        const offlineItems = [
          ...cart.filter(i => i.type === 'product').map((i) => {
            const item = i as { type: 'product'; product: POSProduct; quantity: number };
            const price = item.product.promoPrice ?? item.product.price;
            return {
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: price,
              subtotal: (item.quantity * Number.parseFloat(price)).toFixed(2),
            };
          }),
          ...cart.filter(i => i.type === 'combo').map((i) => {
            const item = i as { type: 'combo'; combo: POSCombo; quantity: number };
            return {
              productName: item.combo.name,
              quantity: item.quantity,
              unitPrice: item.combo.comboPrice,
              subtotal: (item.quantity * Number.parseFloat(item.combo.comboPrice)).toFixed(2),
            };
          }),
        ];
        const total = offlineItems.reduce((sum, item) => sum + Number.parseFloat(item.subtotal), 0).toFixed(2);
        await savePendingSale({
          id: offlineId,
          receiptNumber: `OFFLINE-${Date.now()}`,
          createdAt: new Date().toISOString(),
          locationName,
          payload: {
            locationId: Number(selectedLocationId),
            items: cart
              .filter(i => i.type === 'product')
              .map(i => ({
                productId: (i as { type: 'product'; product: POSProduct; quantity: number }).product.id,
                quantity: i.quantity,
              })),
            comboItems: cart
              .filter(i => i.type === 'combo')
              .map(i => ({
                comboId: (i as { type: 'combo'; combo: POSCombo; quantity: number }).combo.id,
                quantity: i.quantity,
              })),
            customerName: effectiveCustomerName,
            customerEmail: effectivePm === 'fiado' ? (effectiveFiadoCustomer?.email ?? null) : (customerEmail || null),
            customerWhatsapp: effectiveCustomerWhatsapp || null,
            paymentMethod: effectivePm,
            ...(effectiveCustomerId !== undefined && { customerId: effectiveCustomerId }),
            ...(loyaltyCustomerId && { loyaltyCustomerId }),
            ...(loyaltyRewardId && { loyaltyRewardId }),
          },
          displayItems: offlineItems,
          total,
          status: 'pending',
        });
        await refreshCount();
        setCompletedSale({
          sale: {
            id: 0,
            receiptNumber: 'SIN CONEXIÓN',
            customerName: effectiveCustomerName,
            customerEmail: null,
            customerWhatsapp: null,
            paymentMethod: effectivePm,
            total,
            createdAt: new Date().toISOString(),
          },
          items: offlineItems.map((item, idx) => ({ id: idx, ...item })),
        });
      } else {
        setCheckoutError('Error de conexión');
      }
    } finally {
      setSubmitting(false);
    }
  }, [cart, paymentMethod, selectedCustomer, fiadoCustomer, modalFoundCustomer, customerName, customerEmail, customerWhatsapp, selectedLocationId, loyaltyCustomerId, loyaltyRewardId, emitirFactura, arcaActive, buyerType, buyerCuit, locations, refreshCount]);

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

  // ── Customer selector handlers ───────────────────────────────────────────────

  const selectCustomer = useCallback((c: FiadoCustomer) => {
    setSelectedCustomer(c);
    setCustomerQuery('');
    setCustomerDropdownOpen(false);
    setCustomerDropdownResults([]);
    // Sincronizar campos de texto para el flujo de venta
    setCustomerName(c.name);
    setCustomerWhatsapp(c.whatsapp ?? '');
    setCustomerEmail(c.email ?? '');
  }, []);

  const clearSelectedCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setCustomerName('Consumidor final');
    setCustomerEmail('');
    setCustomerWhatsapp('');
    setCustomerQuery('');
  }, []);

  const openCreateCustomer = useCallback(() => {
    const digits = customerQuery.replace(/\D/g, '');
    const isPhone = digits.length >= 6 && digits === customerQuery.replace(/\s/g, '');
    setCreateName(isPhone ? '' : customerQuery);
    setCreatePhone(isPhone ? customerQuery : '');
    setCreateError('');
    setCustomerDropdownOpen(false);
    setShowCreateCustomer(true);
  }, [customerQuery]);

  const handleCreateCustomer = useCallback(async () => {
    if (!createName.trim()) {
      setCreateError('El nombre es requerido');
      return;
    }
    const digits = createPhone.replace(/\D/g, '');
    if (digits.length < 6) {
      setCreateError('El teléfono debe tener al menos 6 dígitos');
      return;
    }
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim(), whatsapp: digits }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? 'Error al crear el cliente');
        return;
      }
      selectCustomer({ id: data.id, name: data.name, whatsapp: data.whatsapp ?? digits, email: data.email ?? null });
      setShowCreateCustomer(false);
      setCreateName('');
      setCreatePhone('');
    } catch {
      setCreateError('Error de conexión');
    } finally {
      setCreateLoading(false);
    }
  }, [createName, createPhone, selectCustomer]);

  const openCreateProductFromScan = useCallback((barcode: string) => {
    setCreateProductName('');
    setCreateProductPrice('');
    setCreateProductBarcode(barcode);
    setCreateProductError('');
    setNotFoundBarcode(null);
    setShowCreateProduct(true);
  }, []);

  const handleCreateProduct = useCallback(async () => {
    if (!createProductName.trim()) {
      setCreateProductError('El nombre es requerido');
      return;
    }
    if (!createProductPrice || Number.isNaN(Number(createProductPrice)) || Number(createProductPrice) <= 0) {
      setCreateProductError('El precio debe ser mayor a 0');
      return;
    }
    setCreateProductLoading(true);
    setCreateProductError('');
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createProductName.trim(),
          price: createProductPrice,
          barcode: createProductBarcode.trim() || null,
          imageUrl: createProductImageUrl || createProductSuggestedImage || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateProductError(data.error ?? 'Error al crear el producto');
        return;
      }
      // Refresh products y agregar el nuevo al carrito
      await fetchProducts(true);
      // Construir el producto POS para agregar al carrito inmediatamente
      const newProduct: POSProduct = {
        id: data.id,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        promoPrice: null,
        promoName: null,
        promoId: null,
        sku: data.sku ?? null,
        barcode: data.barcode ?? null,
        imageUrl: data.imageUrl ?? null,
        categoryId: data.categoryId ?? null,
        categoryName: null,
        stock: null,
      };
      addToCart(newProduct);
      setShowCreateProduct(false);
      setCreateProductName('');
      setCreateProductPrice('');
      setCreateProductBarcode('');
      setCreateProductImageUrl('');
      setCreateProductSuggestedImage(null);
    } catch {
      setCreateProductError('Error de conexión');
    } finally {
      setCreateProductLoading(false);
    }
  }, [createProductName, createProductPrice, createProductBarcode, createProductImageUrl, createProductSuggestedImage, fetchProducts, addToCart]);

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
      let found: FiadoCustomer;
      if (customer?.id) {
        found = { id: customer.id, name: customer.name, whatsapp: customer.whatsapp ?? digits, email: customer.email ?? null };
        setCustomerWhatsapp(found.whatsapp ?? digits);
        if (found.name && found.name !== 'Consumidor final') {
          setCustomerName(found.name);
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
        found = { id: nc.id, name: nc.name, whatsapp: digits, email: null };
        setCustomerWhatsapp(digits);
      }
      setLoyaltyCustomerId(found.id);
      // Guardar el cliente completo por si se elige Fiado en Modal 2
      setModalFoundCustomer(found);
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
    setModalFoundCustomer(null);
  }, []);

  // El ref siempre apunta a openCheckoutFlow para el listener global de doble Enter
  handleCheckoutRef.current = openCheckoutFlow;

  // ── Helpers de pestañas paralelas ──────────────────────────────────────────

  const getActiveTabSnapshot = useCallback((): SaleTab => ({
    id: activeTabId,
    label: saleTabs.find(t => t.id === activeTabId)?.label ?? 'Venta',
    cart,
    selectedCustomer,
    customerName,
    customerEmail,
    customerWhatsapp,
    paymentMethod,
    checkoutError,
    fiadoPhone,
    fiadoCustomer,
    fiadoNotFound,
    emitirFactura,
    buyerType,
    buyerCuit,
    loyaltyCustomerId,
    loyaltyRewardId,
    loyaltyDiscount,
    completedSale,
    checkoutFlowStep,
    modalLoyaltyPhone,
    modalLoyaltyError,
    modalPaymentIdx,
    modalFoundCustomer,
  }), [activeTabId, saleTabs, cart, selectedCustomer, customerName, customerEmail, customerWhatsapp, paymentMethod, checkoutError, fiadoPhone, fiadoCustomer, fiadoNotFound, emitirFactura, buyerType, buyerCuit, loyaltyCustomerId, loyaltyRewardId, loyaltyDiscount, completedSale, checkoutFlowStep, modalLoyaltyPhone, modalLoyaltyError, modalPaymentIdx, modalFoundCustomer]);

  const restoreTabState = useCallback((tab: SaleTab) => {
    setCart(tab.cart);
    setSelectedCustomer(tab.selectedCustomer);
    setCustomerName(tab.customerName);
    setCustomerEmail(tab.customerEmail);
    setCustomerWhatsapp(tab.customerWhatsapp);
    setPaymentMethod(tab.paymentMethod);
    setCheckoutError(tab.checkoutError);
    setFiadoPhone(tab.fiadoPhone);
    setFiadoCustomer(tab.fiadoCustomer);
    setFiadoNotFound(tab.fiadoNotFound);
    setEmitirFactura(tab.emitirFactura);
    setBuyerType(tab.buyerType);
    setBuyerCuit(tab.buyerCuit);
    setLoyaltyCustomerId(tab.loyaltyCustomerId);
    setLoyaltyRewardId(tab.loyaltyRewardId);
    setLoyaltyDiscount(tab.loyaltyDiscount);
    setCompletedSale(tab.completedSale);
    setCheckoutFlowStep(tab.checkoutFlowStep);
    setModalLoyaltyPhone(tab.modalLoyaltyPhone);
    setModalLoyaltyError(tab.modalLoyaltyError);
    setModalPaymentIdx(tab.modalPaymentIdx);
    setModalFoundCustomer(tab.modalFoundCustomer);
  }, []);

  const switchToTab = useCallback((targetId: string) => {
    if (targetId === activeTabId) {
      return;
    }
    const target = saleTabs.find(t => t.id === targetId);
    if (!target) {
      return;
    }
    const snapshot = getActiveTabSnapshot();
    setSaleTabs(prev => prev.map(t => t.id === activeTabId ? snapshot : t));
    restoreTabState(target);
    setActiveTabId(targetId);
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [activeTabId, saleTabs, getActiveTabSnapshot, restoreTabState]);

  const addNewTab = useCallback(() => {
    const snapshot = getActiveTabSnapshot();
    const newId = `tab-${Date.now()}`;
    const newTab: SaleTab = {
      id: newId,
      label: `Venta ${saleTabs.length + 1}`,
      ...FRESH_TAB_STATE,
    };
    setSaleTabs(prev => [...prev.map(t => t.id === activeTabId ? snapshot : t), newTab]);
    setCart([]);
    setSelectedCustomer(null);
    setCustomerName('Consumidor final');
    setCustomerEmail('');
    setCustomerWhatsapp('');
    setCustomerQuery('');
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
    setCompletedSale(null);
    setCheckoutFlowStep('idle');
    setModalLoyaltyPhone('');
    setModalLoyaltyError('');
    setModalPaymentIdx(MERCADOPAGO_IDX >= 0 ? MERCADOPAGO_IDX : 0);
    setModalFoundCustomer(null);
    setActiveTabId(newId);
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [activeTabId, saleTabs, getActiveTabSnapshot]);

  const closeActiveTab = useCallback(() => {
    if (saleTabs.length <= 1) {
      setCart([]);
      setSelectedCustomer(null);
      setCustomerName('Consumidor final');
      setCustomerEmail('');
      setCustomerWhatsapp('');
      setCustomerQuery('');
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
      setCompletedSale(null);
      setCheckoutFlowStep('idle');
      setModalLoyaltyPhone('');
      setModalLoyaltyError('');
      setModalPaymentIdx(MERCADOPAGO_IDX >= 0 ? MERCADOPAGO_IDX : 0);
      setModalFoundCustomer(null);
      fetchProducts(true);
      setTimeout(() => searchRef.current?.focus(), 100);
      return;
    }
    const idx = saleTabs.findIndex(t => t.id === activeTabId);
    const nextTab = saleTabs[idx > 0 ? idx - 1 : 1];
    if (!nextTab) {
      return;
    }
    setSaleTabs(prev => prev.filter(t => t.id !== activeTabId));
    restoreTabState(nextTab);
    setActiveTabId(nextTab.id);
    fetchProducts(true);
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [activeTabId, saleTabs, restoreTabState, fetchProducts]);

  const handleNewSale = () => {
    closeActiveTab();
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
        // Producto no encontrado por código de barras
        setNotFoundBarcode(sku.trim());
        setSearch('');
        e.preventDefault();
        return;
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
      className={`flex flex-col gap-3 ${isFullscreen ? 'h-screen bg-background p-4' : 'h-full'}`}
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

      {/* Offline / pending-sync banners */}
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <WifiOff className="size-4 shrink-0" />
          <span>Sin conexión — las ventas se guardarán localmente y se sincronizarán cuando vuelva la red</span>
        </div>
      )}
      {isOnline && pendingCount > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          {isSyncing
            ? (
                <span>
                  Sincronizando
                  {pendingCount}
                  {' '}
                  venta(s) pendiente(s)...
                </span>
              )
            : (
                <>
                  <span>
                    {pendingCount}
                    {' '}
                    venta(s) pendiente(s) de sincronización
                  </span>
                  <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={syncPendingSales}>
                    Sincronizar ahora
                  </Button>
                </>
              )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-4">
        {/* LEFT — Product grid */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          {/* Location + search bar */}
          <div className="flex flex-wrap gap-2 pt-0.5">
            {locations.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    {locations.find(l => String(l.id) === selectedLocationId)?.name ?? 'Sucursal'}
                    <ChevronDown className="size-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup value={selectedLocationId} onValueChange={setSelectedLocationId}>
                    {locations.map(loc => (
                      <DropdownMenuRadioItem key={loc.id} value={String(loc.id)}>
                        {loc.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="relative flex-1">
              <Scan className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                ref={searchRef}
                className="w-full pl-9"
                placeholder="Buscar o escanear código de barras..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  {filterCategory
                    ? (categories.find(c => String(c.id) === filterCategory)?.name ?? 'Categoría')
                    : 'Todas las categorías'}
                  <ChevronDown className="size-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup value={filterCategory} onValueChange={setFilterCategory}>
                  <DropdownMenuRadioItem value="">Todas las categorías</DropdownMenuRadioItem>
                  {categories.map(cat => (
                    <DropdownMenuRadioItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

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
          <div className="flex-1 overflow-y-auto pt-2">
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
                            {outOfStock
                              ? <p className="text-xs text-destructive">Sin stock</p>
                              : product.stock !== null && (
                                <p className={`text-xs ${product.stock <= 3 ? 'font-semibold text-amber-500' : 'text-muted-foreground'}`}>
                                  Stock:
                                  {' '}
                                  {product.stock}
                                </p>
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

        {/* RIGHT — Ticket de venta */}
        <div className="flex w-[420px] flex-col overflow-hidden rounded-lg border bg-card shadow-sm">

          {/* Panel header */}
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Ticket de venta</span>
              <button
                type="button"
                className="flex size-5 items-center justify-center rounded border text-muted-foreground hover:bg-muted"
                title="Nueva venta (próximamente)"
                disabled
              >
                <Plus className="size-3" />
              </button>
            </div>
            <div className="flex items-center gap-0.5 text-muted-foreground">
              <button type="button" className="rounded p-1.5 hover:bg-muted" title="Configuración" disabled>
                <Settings className="size-4" />
              </button>
              <button type="button" className="rounded p-1.5 hover:bg-muted" title="Imprimir" disabled>
                <Printer className="size-4" />
              </button>
              <button type="button" className="rounded p-1.5 hover:bg-muted" title="Más opciones" disabled>
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>

          {/* Cliente — selector con búsqueda por nombre o teléfono */}
          <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2" ref={customerDropdownRef}>
            <span className="shrink-0 text-sm text-muted-foreground">Cliente</span>
            <div className="relative flex-1">
              {selectedCustomer
                ? (
                    <div className="flex h-8 items-center gap-1.5 rounded-md border bg-muted/50 px-2 text-sm">
                      <span className="flex-1 truncate font-medium">{selectedCustomer.name}</span>
                      {selectedCustomer.whatsapp && (
                        <span className="shrink-0 text-xs text-muted-foreground">{selectedCustomer.whatsapp}</span>
                      )}
                      <button
                        type="button"
                        onClick={clearSelectedCustomer}
                        className="rounded p-0.5 hover:bg-muted"
                        title="Cambiar cliente"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )
                : (
                    <Input
                      className="h-8 text-sm"
                      value={customerQuery}
                      onChange={e => setCustomerQuery(e.target.value)}
                      onFocus={() => {
                        if (customerQuery.length >= 2 && customerDropdownRef.current) {
                          const rect = customerDropdownRef.current.getBoundingClientRect();
                          setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                          setCustomerDropdownOpen(true);
                        }
                      }}
                      placeholder="Buscar por nombre o teléfono..."
                      autoComplete="off"
                    />
                  )}
            </div>
          </div>

          {/* Área del carrito — scrollable */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {cart.length === 0
              ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
                    <ShoppingBasket className="size-14 opacity-20" />
                    <p className="text-center text-sm leading-relaxed">
                      Acá verás los productos que elijas para tu primera venta
                    </p>
                  </div>
                )
              : (
                  <div className="space-y-2 p-3">
                    {cart.map((item) => {
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
                              disabled={item.type === 'product' && item.product.stock !== null && item.quantity >= item.product.stock}
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

                    {/* Campos adicionales */}
                    <div className="space-y-3 border-t pt-3">
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
                    </div>
                  </div>
                )}
          </div>

          {/* Sticky bottom — botón Vender + barra de estado */}
          <div className="shrink-0 border-t">
            {/* Email y WhatsApp opcionales */}
            <div className="grid grid-cols-2 gap-2 border-b px-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="customerEmail" className="text-xs">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  className="h-8 text-xs"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="opcional"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customerWhatsapp" className="text-xs">WhatsApp</Label>
                <Input
                  id="customerWhatsapp"
                  className="h-8 text-xs"
                  value={customerWhatsapp}
                  onChange={e => setCustomerWhatsapp(e.target.value)}
                  placeholder="opcional"
                />
              </div>
            </div>
            {checkoutError && (
              <p className="px-3 pt-2 text-xs text-destructive">{checkoutError}</p>
            )}
            <div className="px-3 py-2">
              <Button
                className="w-full"
                size="lg"
                disabled={submitting || cart.length === 0}
                onClick={openCheckoutFlow}
              >
                <span className="flex w-full items-center justify-between">
                  <span>{submitting ? 'Procesando...' : 'Vender'}</span>
                  <span>
                    $
                    {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </span>
              </Button>
            </div>
            <div className="flex items-center justify-between border-t px-3 py-2 text-sm text-muted-foreground">
              <span>
                {cart.reduce((s, i) => s + i.quantity, 0)}
                {' '}
                Producto
                {cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                className="text-sm hover:text-foreground"
                onClick={closeActiveTab}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de tabs inferior */}
      <div className="flex shrink-0 items-center gap-0.5 border-t px-1 pt-1.5">
        {saleTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchToTab(tab.id)}
            className={`flex h-8 items-center gap-1 rounded-t-md border border-b-0 px-3 text-sm font-medium transition-colors ${
              tab.id === activeTabId
                ? 'bg-card shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>{tab.label}</span>
            {saleTabs.length > 1 && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Cerrar pestaña"
                className="ml-0.5 rounded-sm p-0.5 opacity-50 hover:bg-muted-foreground/20 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  if (tab.id === activeTabId) {
                    closeActiveTab();
                  } else {
                    setSaleTabs(prev => prev.filter(t => t.id !== tab.id));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    if (tab.id === activeTabId) {
                      closeActiveTab();
                    } else {
                      setSaleTabs(prev => prev.filter(t => t.id !== tab.id));
                    }
                  }
                }}
              >
                <X className="size-3" />
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={addNewTab}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Nueva venta en paralelo"
        >
          <Plus className="size-4" />
        </button>
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

      {/* Dropdown selector de cliente — position:fixed escapa overflow:hidden del ticket panel */}
      {customerDropdownOpen && dropdownRect && (
        <div
          ref={customerPortalRef}
          style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999 }}
          className="rounded-md border bg-popover shadow-lg"
        >
          {customerSearchLoading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Buscando...</div>
          )}
          {!customerSearchLoading && customerDropdownResults.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Sin resultados para "
              {customerQuery}
              "
            </div>
          )}
          {customerDropdownResults.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCustomer(c)}
              className="flex w-full flex-col px-3 py-2 text-left hover:bg-muted"
            >
              <span className="text-sm font-medium">{c.name}</span>
              {c.whatsapp && <span className="text-xs text-muted-foreground">{c.whatsapp}</span>}
            </button>
          ))}
          <button
            type="button"
            onClick={openCreateCustomer}
            className="flex w-full items-center gap-1.5 border-t px-3 py-2 text-sm text-primary hover:bg-muted"
          >
            <UserPlus className="size-3.5" />
            Crear cliente
          </button>
        </div>
      )}

      {/* Dialog: producto no encontrado por escaneo */}
      {notFoundBarcode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-80 rounded-lg border bg-background p-5 shadow-xl">
            <h3 className="mb-1 text-sm font-semibold">Producto no encontrado</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              No existe ningún producto con el código
              {' '}
              <span className="font-mono font-medium text-foreground">{notFoundBarcode}</span>
              . ¿Querés crearlo?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setNotFoundBarcode(null)}
              >
                No
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => openCreateProductFromScan(notFoundBarcode)}
              >
                Sí, crear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear producto rápido desde escaneo */}
      {showCreateProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-80 rounded-lg border bg-background p-4 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold">Nuevo producto</h3>
            {createProductError && <p className="mb-2 text-xs text-destructive">{createProductError}</p>}

            {/* Imagen sugerida de Open Food Facts */}
            {(createProductSuggestedImage || createProductFetchingInfo) && (
              <div className="mb-3 flex items-center gap-3 rounded-md border bg-muted/40 p-2">
                {createProductFetchingInfo
                  ? (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        ...
                      </div>
                    )
                  : createProductSuggestedImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={createProductSuggestedImage}
                      alt="Imagen sugerida"
                      className="size-14 shrink-0 rounded object-contain"
                    />
                  )}
                <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                  {createProductFetchingInfo
                    ? 'Buscando info del producto...'
                    : 'Imagen encontrada en Open Food Facts'}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div>
                <Label className="text-xs">Nombre *</Label>
                <Input
                  ref={createProductNameRef}
                  value={createProductName}
                  onChange={e => setCreateProductName(e.target.value)}
                  className="mt-0.5 h-8 text-sm"
                  placeholder="Nombre del producto"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateProduct();
                      return;
                    }
                    // Detectar escáner (chars muy rápidos) y redirigir al campo barcode
                    const now = Date.now();
                    const diff = now - lastKeyTime.current;
                    lastKeyTime.current = now;
                    if (diff < 80 && e.key.length === 1) {
                      e.preventDefault();
                      setCreateProductBarcode(prev => prev + e.key);
                      createProductBarcodeRef.current?.focus();
                    }
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Precio de venta *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createProductPrice}
                  onChange={e => setCreateProductPrice(e.target.value)}
                  className="mt-0.5 h-8 text-sm"
                  placeholder="Ej: 1500"
                  onKeyDown={e => e.key === 'Enter' && handleCreateProduct()}
                />
              </div>
              <div>
                <Label className="text-xs">Código de barras</Label>
                <Input
                  ref={createProductBarcodeRef}
                  value={createProductBarcode}
                  onChange={e => setCreateProductBarcode(e.target.value)}
                  className="mt-0.5 h-8 font-mono text-sm"
                  placeholder="Escaneá o escribí el código"
                  onKeyDown={e => e.key === 'Enter' && handleCreateProduct()}
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowCreateProduct(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={createProductLoading}
                onClick={handleCreateProduct}
              >
                {createProductLoading ? 'Creando...' : 'Crear y agregar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear cliente rápido */}
      {showCreateCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-80 rounded-lg border bg-background p-4 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold">Nuevo cliente</h3>
            {createError && <p className="mb-2 text-xs text-destructive">{createError}</p>}
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Nombre *</Label>
                <Input
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  className="mt-0.5 h-8 text-sm"
                  placeholder="Nombre del cliente"
                  onKeyDown={e => e.key === 'Enter' && handleCreateCustomer()}
                />
              </div>
              <div>
                <Label className="text-xs">Teléfono / WhatsApp *</Label>
                <Input
                  value={createPhone}
                  onChange={e => setCreatePhone(e.target.value)}
                  className="mt-0.5 h-8 text-sm"
                  placeholder="Ej: 1122334455"
                  onKeyDown={e => e.key === 'Enter' && handleCreateCustomer()}
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowCreateCustomer(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={createLoading}
                onClick={handleCreateCustomer}
              >
                {createLoading ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
