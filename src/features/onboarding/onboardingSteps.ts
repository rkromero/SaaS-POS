export const TOTAL_STEPS = 4;

export type OnboardingStepDef = {
  step: number;

  // ── Fase 1: spotlight en el sidebar (cuando NO está en la página destino) ──
  navTargetId: string; // id del link en el sidebar
  href: string; // ruta destino
  navTitle: string;
  navDescription: string;
  navActionLabel: string; // texto del botón en el popover del spotlight

  // ── Fase 2: floating card (cuando ya está en la página destino) ──
  pageTitle: string;
  pageInstruction: string; // qué tiene que hacer en la página
  pageActionLabel: string; // "Ya lo creé →"
};

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    step: 1,
    navTargetId: 'nav-locations',
    href: '/dashboard/locations',
    navTitle: 'Paso 1 de 4 — Creá tu local',
    navDescription:
      'Un <strong>local</strong> es tu punto de venta. Puede ser una tienda, un depósito o un puesto. Hacé click en <strong>Locales</strong> para ir a esa sección.',
    navActionLabel: 'Ir a Locales →',
    pageTitle: 'Creá tu primer local',
    pageInstruction:
      'Hacé click en el botón "+ Nuevo local", completá el nombre y guardalo.',
    pageActionLabel: 'Ya lo creé →',
  },
  {
    step: 2,
    navTargetId: 'nav-products',
    href: '/dashboard/products',
    navTitle: 'Paso 2 de 4 — Cargá tus productos',
    navDescription:
      'Aquí vas a crear las <strong>categorías</strong> y los <strong>productos</strong> que vendés. Hacé click en <strong>Productos</strong> para continuar.',
    navActionLabel: 'Ir a Productos →',
    pageTitle: 'Creá una categoría y un producto',
    pageInstruction:
      'Primero creá una categoría (ej: "Bebidas") y luego agregá un producto con nombre y precio.',
    pageActionLabel: 'Ya los cargué →',
  },
  {
    step: 3,
    navTargetId: 'nav-stock',
    href: '/dashboard/stock',
    navTitle: 'Paso 3 de 4 — Cargá el stock',
    navDescription:
      'Indicale a TuCaja cuántas unidades tenés disponibles. Hacé click en <strong>Stock</strong> para continuar.',
    navActionLabel: 'Ir a Stock →',
    pageTitle: 'Cargá el stock inicial',
    pageInstruction:
      'Buscá tus productos y asignales la cantidad de unidades disponibles. TuCaja las descontará automáticamente con cada venta.',
    pageActionLabel: 'Ya lo cargué →',
  },
  {
    step: 4,
    navTargetId: 'nav-pos',
    href: '/dashboard/pos',
    navTitle: 'Paso 4 de 4 — Registrá una venta',
    navDescription:
      '¡Ya tenés todo configurado! Hacé click en <strong>Caja POS</strong> para registrar tu primera venta.',
    navActionLabel: 'Ir a la Caja →',
    pageTitle: '¡Registrá tu primera venta!',
    pageInstruction:
      'Seleccioná un producto, elegí el método de pago y hacé click en "Cobrar". ¡Ya está!',
    pageActionLabel: '¡Listo, terminé! →',
  },
];
