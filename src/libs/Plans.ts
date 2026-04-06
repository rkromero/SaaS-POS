// Plan definitions for the SaaS POS
// Prices in USD, billed in ARS at current exchange rate via Mercado Pago

export type PlanType = 'free' | 'socio' | 'basic' | 'pro' | 'enterprise';

export type Plan = {
  id: PlanType;
  name: string;
  description: string;
  priceUSD: number; // 0 = free
  priceLabel: string;
  maxLocations: number; // -1 = unlimited
  maxMonthlySales: number; // -1 = unlimited
  features: string[];
  highlighted: boolean;
  manualAssign: boolean; // true = admin assigns manually, not self-service
};

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    description: 'Para probar el sistema',
    priceUSD: 0,
    priceLabel: 'Gratis',
    maxLocations: 1,
    maxMonthlySales: 200,
    features: [
      '1 local',
      'Hasta 200 ventas por mes',
      'Gestión de productos',
      'Control de stock',
    ],
    highlighted: false,
    manualAssign: false,
  },
  {
    id: 'socio',
    name: 'Socio',
    description: 'Para kioscos que venden nuestros alfajores',
    priceUSD: 0,
    priceLabel: 'Gratis',
    maxLocations: 1,
    maxMonthlySales: -1,
    features: [
      '1 local',
      'Ventas ilimitadas',
      'Gestión de productos',
      'Control de stock',
      'Reportes y métricas',
      '✓ Requiere vender productos del socio',
    ],
    highlighted: false,
    manualAssign: true, // admin assigns this plan
  },
  {
    id: 'basic',
    name: 'Básico',
    description: 'Para kioscos independientes',
    priceUSD: 15,
    priceLabel: 'USD 15/mes',
    maxLocations: 1,
    maxMonthlySales: -1,
    features: [
      '1 local',
      'Ventas ilimitadas',
      'Gestión de productos y categorías',
      'Control de stock',
      'Historial de ventas',
      'Reportes y métricas',
    ],
    highlighted: false,
    manualAssign: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para cadenas con múltiples sucursales',
    priceUSD: 35,
    priceLabel: 'USD 35/mes',
    maxLocations: 3,
    maxMonthlySales: -1,
    features: [
      'Hasta 3 locales',
      'Ventas ilimitadas',
      'Gestión de productos y categorías',
      'Control de stock por local',
      'Historial de ventas',
      'Reportes y métricas',
      'Asignación de usuarios por local',
    ],
    highlighted: true,
    manualAssign: false,
  },
  {
    id: 'enterprise',
    name: 'Empresa',
    description: 'Para franquicias y cadenas grandes',
    priceUSD: 80,
    priceLabel: 'USD 80/mes',
    maxLocations: -1,
    maxMonthlySales: -1,
    features: [
      'Locales ilimitados',
      'Ventas ilimitadas',
      'Todo lo del plan Pro',
      'Soporte prioritario',
    ],
    highlighted: false,
    manualAssign: false,
  },
];

export const getPlan = (id: PlanType): Plan =>
  PLANS.find(p => p.id === id) ?? PLANS[0]!;

// Check if org can create more locations
export const canAddLocation = (planId: PlanType, currentLocations: number): boolean => {
  const plan = getPlan(planId);
  if (plan.maxLocations === -1) {
    return true;
  }
  return currentLocations < plan.maxLocations;
};

// Check if org can register more sales this month
export const canRegisterSale = (planId: PlanType, monthlySalesCount: number): boolean => {
  const plan = getPlan(planId);
  if (plan.maxMonthlySales === -1) {
    return true;
  }
  return monthlySalesCount < plan.maxMonthlySales;
};
