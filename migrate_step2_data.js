// ================================================
// CAFTAN - DATA MIGRATION SCRIPT
// Copies all data from OLD project to NEW project
// Run: node migrate_step2_data.js
// ================================================

import { createClient } from '@supabase/supabase-js';

// OLD PROJECT (restricted/quota exceeded)
const OLD_URL  = 'https://nsjyyivbpyexqvywymaz.supabase.co';
const OLD_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zanl5aXZicHlleHF2eXd5bWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDE2NzYsImV4cCI6MjA4ODIxNzY3Nn0.OplPHYNBci-LZAhmbaAp0lB0eHfBV2jl8M7sBkzcAOU';

// NEW PROJECT
const NEW_URL  = 'https://dpnttpriwkxddhrxntgu.supabase.co';
const NEW_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbnR0cHJpd2t4ZGRocnhudGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NzM2NjksImV4cCI6MjA5NDI0OTY2OX0.HNlIiS9h_FS0oIZENrJiV-ohwpb3qVK1C-uQahoRyvk';

const opts = { realtime: { transport: () => {} }, global: { fetch } };
const oldDb = createClient(OLD_URL, OLD_KEY, opts);
const newDb = createClient(NEW_URL, NEW_KEY, opts);

// Tables to migrate IN ORDER (dependencies first)
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
  process.stdout.write(`  Migrating ${tableName}... `);

  // Fetch all rows from old project
  const { data, error } = await oldDb.from(tableName).select('*');

  if (error) {
    console.log(`SKIPPED (${error.message})`);
    return 0;
  }

  if (!data || data.length === 0) {
    console.log('empty (0 rows)');
    return 0;
  }

  // Insert into new project in batches of 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error: insertError } = await newDb
      .from(tableName)
      .upsert(batch, { onConflict: 'id' });

    if (insertError) {
      console.log(`\n    ERROR on batch ${i}: ${insertError.message}`);
      break;
    }
    inserted += batch.length;
  }

  console.log(`✅ ${inserted} rows`);
  return inserted;
}

async function main() {
  console.log('\n🚀 CAFTAN DATABASE MIGRATION');
  console.log('================================');
  console.log(`FROM: ${OLD_URL}`);
  console.log(`TO:   ${NEW_URL}\n`);

  let total = 0;
  for (const table of TABLES) {
    const count = await migrateTable(table);
    total += count;
  }

  console.log('\n================================');
  console.log(`✅ Migration complete! Total rows: ${total}`);
  console.log('\n⚠️  IMPORTANT: Update your .env file now!');
  console.log('   Run: node migrate_step3_env.js');
}

main().catch(console.error);
