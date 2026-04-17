// Script: run-promotions-migration.mjs
// Applies only the promotions migration SQL directly via pg.
// Run with: node scripts/run-promotions-migration.mjs

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';
import pg from 'pg';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(resolve(__dirname, '../migrations/0013_promotions.sql'), 'utf8');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  console.log('Connected to database.');
  await client.query(sql);
  console.log('✓ Promotions migration applied successfully.');
} catch (err) {
  if (err.code === '42710' || err.message?.includes('already exists')) {
    console.log('✓ Tables/types already exist — migration already applied.');
  } else {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  }
} finally {
  await client.end();
}
