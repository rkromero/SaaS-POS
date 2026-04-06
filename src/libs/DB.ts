import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { PHASE_PRODUCTION_BUILD } from 'next/dist/shared/lib/constants';
import { Pool } from 'pg';

import * as schema from '@/models/Schema';

import { Env } from './Env';

let drizzle;

if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD && Env.DATABASE_URL) {
  // Pool en lugar de Client: reutiliza conexiones entre invocaciones serverless
  // dentro de la misma instancia y permite queries paralelas.
  const globalPool = globalThis as unknown as { pgPool: Pool };
  if (!globalPool.pgPool) {
    globalPool.pgPool = new Pool({
      connectionString: Env.DATABASE_URL,
      max: 3, // máximo 3 conexiones por instancia serverless
      idleTimeoutMillis: 30000, // libera conexiones ociosas después de 30s
      connectionTimeoutMillis: 5000,
    });
  }

  // Las migraciones se corren con `npm run db:migrate`, no en cada request.
  drizzle = drizzlePg(globalPool.pgPool, { schema });
} else {
  const global = globalThis as unknown as { client: PGlite; drizzle: PgliteDatabase<typeof schema> };

  if (!global.client) {
    global.client = new PGlite();
    await global.client.waitReady;
    global.drizzle = drizzlePglite(global.client, { schema });
    await migratePglite(global.drizzle, {
      migrationsFolder: path.join(process.cwd(), 'migrations'),
    });
  }

  drizzle = global.drizzle;
}

export const db = drizzle;
