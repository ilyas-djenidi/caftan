// ================================================
// CAFTAN - Direct PostgreSQL Migration
// Copies all tables from OLD project via raw PG connection
// Run from project root: node scripts/migrate_pg.js
// ================================================

import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load .env from project root
const env = {};
readFileSync(path.join(ROOT, '.env'), 'utf-8').split('\n').forEach(l => {
    const i = l.indexOf('=');
    if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["'](.*)['"']$/, '$1');
});

const { Client } = pg;

// OLD PROJECT — direct DB connection
const oldPg = new Client({
    host:                    'db.nsjyyivbpyexqvywymaz.supabase.co',
    port:                    5432,
    database:                'postgres',
    user:                    'postgres',
    password:                '90.azqswx000',
    ssl:                     { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

// NEW PROJECT — via REST API
const newDb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    realtime: { transport: () => {} },
    global:   { fetch },
});

const TABLES = [
    'products', 'product_images', 'product_attributes',
    'packs', 'pack_items',
    'orders', 'order_items',
    'messages', 'reviews',
    'hero_banners', 'site_settings', 'promo_codes', 'shipping_rates',
];

async function migrateTable(tableName) {
    process.stdout.write(`  ${tableName}... `);
    try {
        const { rows } = await oldPg.query(`SELECT * FROM public.${tableName}`);
        if (!rows || rows.length === 0) { console.log('empty'); return 0; }

        let inserted = 0;
        for (let i = 0; i < rows.length; i += 100) {
            const batch = rows.slice(i, i + 100);
            const { error } = await newDb.from(tableName).upsert(batch, { onConflict: 'id' });
            if (error) { console.log(`\n    ⚠️  ${error.message}`); break; }
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
    for (const table of TABLES) total += await migrateTable(table);

    await oldPg.end();
    console.log('\n=========================================');
    console.log(`✅ Done! Total rows migrated: ${total}`);
}

main().catch(console.error);
