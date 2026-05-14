// ================================================
// CAFTAN - Data Migration (Old → New Supabase)
// Run from project root: node scripts/migrate_step2_data.js
// ================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const env = {};
readFileSync(path.join(ROOT, '.env'), 'utf-8').split('\n').forEach(l => {
    const i = l.indexOf('=');
    if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["'](.*)['"']$/, '$1');
});

// OLD PROJECT (restricted/quota exceeded)
const OLD_URL = 'https://nsjyyivbpyexqvywymaz.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zanl5aXZicHlleHF2eXd5bWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDE2NzYsImV4cCI6MjA4ODIxNzY3Nn0.OplPHYNBci-LZAhmbaAp0lB0eHfBV2jl8M7sBkzcAOU';

const opts  = { realtime: { transport: () => {} }, global: { fetch } };
const oldDb = createClient(OLD_URL, OLD_KEY, opts);
const newDb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, opts);

const TABLES = [
    'products', 'product_images', 'product_attributes',
    'packs', 'pack_items',
    'orders', 'order_items',
    'messages', 'reviews',
    'hero_banners', 'site_settings', 'promo_codes', 'shipping_rates',
];

async function migrateTable(tableName) {
    process.stdout.write(`  ${tableName}... `);

    const { data, error } = await oldDb.from(tableName).select('*');
    if (error) { console.log(`SKIPPED (${error.message})`); return 0; }
    if (!data || data.length === 0) { console.log('empty'); return 0; }

    let inserted = 0;
    for (let i = 0; i < data.length; i += 100) {
        const batch = data.slice(i, i + 100);
        const { error: insertError } = await newDb.from(tableName).upsert(batch, { onConflict: 'id' });
        if (insertError) { console.log(`\n    ERROR: ${insertError.message}`); break; }
        inserted += batch.length;
    }

    console.log(`✅ ${inserted} rows`);
    return inserted;
}

async function main() {
    console.log('\n🚀 CAFTAN DATABASE MIGRATION');
    console.log('================================');
    console.log(`FROM: ${OLD_URL}`);
    console.log(`TO:   ${env.VITE_SUPABASE_URL}\n`);

    let total = 0;
    for (const table of TABLES) total += await migrateTable(table);

    console.log('\n================================');
    console.log(`✅ Migration complete! Total rows: ${total}`);
}

main().catch(console.error);
