// Módulos disponibles para activar/desactivar por cliente
// Un módulo activo manualmente siempre está disponible, sin importar el plan.

export type ModuleId =
  | 'branding'
  | 'arca'
  | 'advanced_reports'
  | 'multi_location'
  | 'exports'
  | 'integrations'
  | 'ai_features';

export type Module = {
  id: ModuleId;
  name: string;
  description: string;
};

export const MODULES: Module[] = [
  {
    id: 'branding',
    name: 'Branding / Personalización',
    description: 'Logo, colores y nombre de marca propios',
  },
  {
    id: 'arca',
    name: 'Facturación ARCA/AFIP',
    description: 'Emisión de facturas electrónicas',
  },
  {
    id: 'advanced_reports',
    name: 'Reportes Avanzados',
    description: 'Métricas y análisis detallados de ventas',
  },
  {
    id: 'multi_location',
    name: 'Múltiples Locales',
    description: 'Sin límite de locales independiente del plan',
  },
  {
    id: 'exports',
    name: 'Exportaciones',
    description: 'Exportar datos a Excel / CSV',
  },
  {
    id: 'integrations',
    name: 'Integraciones',
    description: 'Conexión con sistemas de terceros',
  },
  {
    id: 'ai_features',
    name: 'Funcionalidades con IA',
    description: 'Sugerencias y análisis inteligentes',
  },
];

export const getModule = (id: string): Module | undefined =>
  MODULES.find(m => m.id === id);
