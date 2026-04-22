import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { arcaConfigSchema, locationArcaConfigSchema } from '@/models/Schema';

export type ArcaConfig = {
  cuit: string;
  razonSocial: string;
  puntoVenta: number;
  tipoContribuyente: string;
  ambiente: string;
  cert: string | null;
  privateKey: string | null;
  isActive: boolean;
};

// Resuelve la configuración ARCA efectiva para una venta:
// 1. Si el local tiene config propia activa con cert → la usa
// 2. Si no → fallback a la config de la organización
export async function resolveArcaConfig(
  orgId: string,
  locationId: number,
): Promise<ArcaConfig | null> {
  const [locationConfig] = await db
    .select()
    .from(locationArcaConfigSchema)
    .where(eq(locationArcaConfigSchema.locationId, locationId));

  if (locationConfig?.isActive && locationConfig.cert && locationConfig.privateKey) {
    return locationConfig;
  }

  const [orgConfig] = await db
    .select()
    .from(arcaConfigSchema)
    .where(eq(arcaConfigSchema.organizationId, orgId));

  return orgConfig ?? null;
}
