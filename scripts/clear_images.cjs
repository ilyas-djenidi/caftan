/**
 * clear_images.cjs
 * Wipes all product images from Supabase (useful for a clean reset).
 * Run from project root: node scripts/clear_images.cjs
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Load .env from project root
const env = {};
fs.readFileSync(path.join(ROOT, '.env'), 'utf-8').split('\n').forEach(l => {
    const i = l.indexOf('=');
    if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["'](.*)['"']$/, '$1');
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const h   = { 'apikey': key, 'Authorization': `Bearer ${key}` };

async function run() {
    console.log('🧹 Clearing old images...\n');

    const r1 = await fetch(`${url}/rest/v1/product_images?id=not.eq.00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE', headers: h,
    });
    console.log(`Product images deleted: ${r1.status}`);

    const r2 = await fetch(`${url}/rest/v1/packs?id=not.eq.00000000-0000-0000-0000-000000000000`, {
        method:  'PATCH',
        headers: { ...h, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image_url: null }),
    });
    console.log(`Pack images cleared: ${r2.status}`);

    const r3 = await fetch(`${url}/rest/v1/order_items?id=not.eq.00000000-0000-0000-0000-000000000000`, {
        method:  'PATCH',
        headers: { ...h, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ product_image: null }),
    });
    console.log(`Order item images cleared: ${r3.status}`);

    console.log('\n✅ Done!');
}

run().catch(console.error);
