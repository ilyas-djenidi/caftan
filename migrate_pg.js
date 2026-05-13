// Direct PostgreSQL connection — bypasses the REST API block
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

// OLD PROJECT — direct DB connection
const oldPg = new Client({
  host: 'db.nsjyyivbpyexqvywymaz.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '90.azqswx000',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

// NEW PROJECT — via REST API (works fine)
const NEW_URL = 'https://dpnttpriwkxddhrxntgu.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbnR0cHJpd2t4ZGRocnhudGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NzM2NjksImV4cCI6MjA5NDI0OTY2OX0.HNlIiS9h_FS0oIZENrJiV-ohwpb3qVK1C-uQahoRyvk';
const opts = { realtime: { transport: () => {} }, global: { fetch } };
const newDb = createClient(NEW_URL, NEW_KEY, opts);

const TABLES = [
  'products',
  'product_images',
  'product_attributes',
  'packs',
  'pack_items',
  'orders',
  'order_items',
  'messages',
  'reviews',
  'hero_banners',
  'site_settings',
  'promo_codes',
  'shipping_rates',
];

async function migrateTable(tableName) {
  process.stdout.write(`  ${tableName}... `);
  try {
    const res = await oldPg.query(`SELECT * FROM public.${tableName}`);
    const rows = res.rows;

    if (!rows || rows.length === 0) {
      console.log('empty');
      return 0;
    }

    const batchSize = 100;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await newDb.from(tableName).upsert(batch, { onConflict: 'id' });
      if (error) {
        console.log(`\n    ⚠️  Insert error: ${error.message}`);
        break;
      }
      inserted += batch.length;
    }
    console.log(`✅ ${inserted} rows`);
    return inserted;
  } catch (err) {
    console.log(`SKIPPED (${err.message})`);
    return 0;
  }
}

async function main() {
  console.log('\n🚀 CAFTAN MIGRATION (Direct PostgreSQL)');
  console.log('=========================================');

  try {
    await oldPg.connect();
    console.log('✅ Connected to old database!\n');
  } catch (err) {
    console.error('❌ Cannot connect to old database:', err.message);
    process.exit(1);
  }

  let total = 0;
  for (const table of TABLES) {
    const count = await migrateTable(table);
    total += count;
  }

  await oldPg.end();

  console.log('\n=========================================');
  console.log(`✅ Done! Total rows migrated: ${total}`);
}

main().catch(console.error);
