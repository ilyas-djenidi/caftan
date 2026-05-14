// ================================================
// CAFTAN - CSV IMPORT SCRIPT
// Imports CSV files into the Supabase project
// Run from project root: node scripts/migrate_csv.js
// ================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT     = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

// Load .env from project root
const env = {};
readFileSync(path.join(ROOT, '.env'), 'utf-8').split('\n').forEach(l => {
    const i = l.indexOf('=');
    if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["'](.*)['"']$/, '$1');
});

const NEW_URL = env.VITE_SUPABASE_URL;
const NEW_KEY = env.VITE_SUPABASE_ANON_KEY;
const opts    = { realtime: { transport: () => {} }, global: { fetch } };
const newDb   = createClient(NEW_URL, NEW_KEY, opts);

function castRow(row, tableName) {
    const result = {};

    if (tableName === 'orders') {
        if (row.city) row.commune = row.city;
    }
    if (tableName === 'messages') {
        if (row.sender_name)  row.full_name = row.sender_name;
        if (row.body && !row.message) row.message = row.body;
        if (row.sender_email && !row.email) row.email = row.sender_email;
        if (row.sender_phone && !row.phone) row.phone = row.sender_phone;
    }
    if (tableName === 'shipping_rates') {
        if (row.tarif_domicile) row.home_price = row.tarif_domicile;
        if (row.tarif_stopdesk) row.desk_price = row.tarif_stopdesk;
    }

    const IGNORED = [
        'name', 'city', 'body', 'sender_name', 'sender_email', 'sender_phone',
        'updated_at', 'is_read', 'is_wholesale', 'customer_email', 'payment_method',
        'guepex_created_at', 'delivery_type', 'delivery_fee', 'delivery_wilaya',
        'delivery_commune', 'frais_livraison', 'price_at_time', 'zone',
        'tarif_domicile', 'tarif_stopdesk', 'tarif_retour', 'is_available', 'label',
    ];

    for (const [key, val] of Object.entries(row)) {
        if (IGNORED.includes(key)) continue;
        if (val === '' || val === 'null' || val === undefined) result[key] = null;
        else if (val === 'true')  result[key] = true;
        else if (val === 'false') result[key] = false;
        else result[key] = val;
    }
    return result;
}

async function importCSV(csvFile, tableName) {
    const filePath = path.join(DATA_DIR, csvFile);
    if (!existsSync(filePath)) {
        console.log(`  ${tableName}... SKIPPED (file not found: ${csvFile})`);
        return 0;
    }

    process.stdout.write(`  ${tableName}... `);

    const rows = parse(readFileSync(filePath, 'utf8'), {
        columns:            true,
        skip_empty_lines:   true,
        relax_quotes:       true,
        relax_column_count: true,
    }).map(row => castRow(row, tableName));

    if (rows.length === 0) { console.log('empty'); return 0; }

    const BATCH = 50;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        let error;
        if (batch[0] && !batch[0].id) {
            ({ error } = await newDb.from(tableName).insert(batch));
        } else {
            ({ error } = await newDb.from(tableName).upsert(batch, { onConflict: 'id' }));
        }
        if (error) { console.log(`\n    ⚠️  Error: ${error.message}`); break; }
        inserted += batch.length;
    }

    console.log(`✅ ${inserted} rows`);
    return inserted;
}

const FILES = [
    ['products_rows.csv',           'products'],
    ['product_images_rows.csv',     'product_images'],
    ['product_attributes_rows.csv', 'product_attributes'],
    ['packs_rows.csv',              'packs'],
    ['pack_items_rows.csv',         'pack_items'],
    ['orders_rows.csv',             'orders'],
    ['order_items_rows.csv',        'order_items'],
    ['messages_rows.csv',           'messages'],
    ['shipping_rates_rows.csv',     'shipping_rates'],
];

async function main() {
    console.log('\n📦 CAFTAN - CSV IMPORT');
    console.log('======================');
    console.log(`Data dir: ${DATA_DIR}\n`);

    let total = 0;
    for (const [file, table] of FILES) {
        total += await importCSV(file, table);
    }

    console.log('\n======================');
    console.log(`✅ Done! Total rows imported: ${total}`);
}

main().catch(console.error);
