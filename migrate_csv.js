// ================================================
// CAFTAN - CSV IMPORT SCRIPT
// Imports CSV files into the new Supabase project
// Run: node migrate_csv.js
// ================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';

const NEW_URL = 'https://dpnttpriwkxddhrxntgu.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbnR0cHJpd2t4ZGRocnhudGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NzM2NjksImV4cCI6MjA5NDI0OTY2OX0.HNlIiS9h_FS0oIZENrJiV-ohwpb3qVK1C-uQahoRyvk';
const opts = { realtime: { transport: () => {} }, global: { fetch } };
const newDb = createClient(NEW_URL, NEW_KEY, opts);

function castRow(row, tableName) {
  const result = {};
  
  // Custom mapping based on table
  if (tableName === 'orders') {
    if (row.city) row.commune = row.city;
  }
  if (tableName === 'messages') {
    if (row.sender_name) row.full_name = row.sender_name;
    if (row.body && !row.message) row.message = row.body;
    if (row.sender_email && !row.email) row.email = row.sender_email;
    if (row.sender_phone && !row.phone) row.phone = row.sender_phone;
  }

  if (tableName === 'shipping_rates') {
    if (row.tarif_domicile) row.home_price = row.tarif_domicile;
    if (row.tarif_stopdesk) row.desk_price = row.tarif_stopdesk;
  }

  for (const [key, val] of Object.entries(row)) {
    // Ignore columns that don't belong to the new schema
    const ignored = ['name', 'city', 'body', 'sender_name', 'sender_email', 'sender_phone', 'updated_at', 'is_read', 'is_wholesale', 'customer_email', 'payment_method', 'guepex_created_at', 'delivery_type', 'delivery_fee', 'delivery_wilaya', 'delivery_commune', 'frais_livraison', 'price_at_time', 'zone', 'tarif_domicile', 'tarif_stopdesk', 'tarif_retour', 'is_available', 'label'];
    if (ignored.includes(key)) continue;

    if (val === '' || val === 'null' || val === undefined) {
      result[key] = null;
    } else if (val === 'true') {
      result[key] = true;
    } else if (val === 'false') {
      result[key] = false;
    } else {
      result[key] = val;
    }
  }
  return result;
}

async function importCSV(csvFile, tableName) {
  if (!existsSync(csvFile)) {
    console.log(`  ${tableName}... SKIPPED (file not found: ${csvFile})`);
    return 0;
  }

  process.stdout.write(`  ${tableName}... `);

  const content = readFileSync(csvFile, 'utf8');
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }).map(row => castRow(row, tableName));

  if (rows.length === 0) {
    console.log('empty');
    return 0;
  }

  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    // Some tables like pack_items don't have id in the CSV provided, so we insert instead of upsert
    let error;
    if (batch[0] && !batch[0].id) {
      const res = await newDb.from(tableName).insert(batch);
      error = res.error;
    } else {
      const res = await newDb.from(tableName).upsert(batch, { onConflict: 'id' });
      error = res.error;
    }
    
    if (error) {
      console.log(`\n    ⚠️  Error: ${error.message}`);
      break;
    }
    inserted += batch.length;
  }

  console.log(`✅ ${inserted} rows`);
  return inserted;
}

// Map CSV filename → table name
const FILES = [
  ['products_rows.csv',           'products'],
  ['product_images_rows.csv',     'product_images'],
  ['product_attributes_rows.csv', 'product_attributes'],
  ['packs_rows.csv',              'packs'],
  ['pack_items_rows.csv',         'pack_items'],
  ['orders_rows.csv',             'orders'],
  ['order_items_rows.csv',        'order_items'],
  ['messages_rows.csv',           'messages'],
  ['reviews_rows.csv',            'reviews'],
  ['hero_banners_rows.csv',       'hero_banners'],
  ['promo_codes_rows.csv',        'promo_codes'],
  ['shipping_rates_rows.csv',     'shipping_rates'],
];

async function main() {
  console.log('\n📦 CAFTAN - CSV IMPORT TO NEW PROJECT');
  console.log('========================================');

  let total = 0;
  for (const [file, table] of FILES) {
    const count = await importCSV(file, table);
    total += count;
  }

  console.log('\n========================================');
  console.log(`✅ Done! Total rows imported: ${total}`);
  console.log('\n🎉 Your new project is ready!');
  console.log(`   URL: ${NEW_URL}`);
}

main().catch(console.error);
