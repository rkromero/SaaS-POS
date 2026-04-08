export const TOTAL_STEPS = 4;

export type OnboardingStepDef = {
  step: number;
  targetId: string;
  title: string;
  description: string;
  actionLabel: string;
};

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    step: 1,
    targetId: 'nav-locations',
    title: 'Paso 1 de 4 — Creá tu local',
    description:
      'Un <strong>local</strong> es tu punto de venta. Puede ser una tienda, un depósito o un puesto. Hacé click en <strong>Locales</strong> y creá el primero.',
    actionLabel: 'Ya lo creé →',
  },
  {
    step: 2,
    targetId: 'nav-products',
    title: 'Paso 2 de 4 — Cargá tus productos',
    description:
      'Creá una <strong>categoría</strong> (ej: "Bebidas") y luego agregá tus primeros productos con nombre, precio y descripción.',
    actionLabel: 'Ya los cargué →',
  },
  {
    step: 3,
    targetId: 'nav-stock',
    title: 'Paso 3 de 4 — Cargá el stock',
    description:
      'Indicá cuántas unidades tenés disponibles de cada producto. TuCaja va a descontar automáticamente el stock con cada venta.',
    actionLabel: 'Ya lo cargué →',
  },
  {
    step: 4,
    targetId: 'nav-pos',
    title: 'Paso 4 de 4 — Registrá una venta',
    description:
      '¡Todo listo! Desde la <strong>Caja POS</strong> podés seleccionar productos, cobrarlos y registrar tu primera venta.',
    actionLabel: 'Ir a la caja →',
  },
];
