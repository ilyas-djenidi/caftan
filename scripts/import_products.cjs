/**
 * import_products.cjs
 * Imports products from CSV into Supabase.
 * Run from project root: node scripts/import_products.cjs
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

// Load .env from project root
const env = {};
fs.readFileSync(path.join(ROOT, '.env'), 'utf-8').split('\n').forEach(l => {
    const i = l.indexOf('=');
    if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["'](.*)['"']$/, '$1');
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

const headers = {
    'apikey':        key,
    'Authorization': `Bearer ${key}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
};

// Full CSV parser — handles quoted multi-line fields
function parseCSV(text) {
    const rows    = [];
    let inQuote   = false;
    let field     = '';
    let row       = [];

    for (let i = 0; i < text.length; i++) {
        const ch   = text[i];
        const next = text[i + 1];

        if (ch === '"') {
            if (inQuote && next === '"') { field += '"'; i++; }
            else inQuote = !inQuote;
        } else if (ch === ',' && !inQuote) {
            row.push(field); field = '';
        } else if ((ch === '\n' || (ch === '\r' && next === '\n')) && !inQuote) {
            if (ch === '\r') i++;
            row.push(field); field = '';
            rows.push(row);  row   = [];
        } else {
            field += ch;
        }
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
}

async function checkExisting() {
    const res  = await fetch(`${url}/rest/v1/products?select=id&limit=1`, { headers });
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
}

async function run() {
    console.log('🔍 Checking existing products in DB...');
    console.log(`   Found ${await checkExisting()} products\n`);

    console.log('📂 Reading products_rows.csv...');
    const csvText    = fs.readFileSync(path.join(DATA_DIR, 'products_rows.csv'), 'utf-8');
    const rows       = parseCSV(csvText);
    const headersCsv = rows[0];
    console.log(`   CSV columns: ${headersCsv.join(', ')}`);
    console.log(`   Total rows:  ${rows.length - 1}\n`);

    const products = rows.slice(1).map(row => {
        const obj = {};
        headersCsv.forEach((col, i) => {
            let val = row[i] || null;
            if (val === 'null' || val === '') val = null;
            if (val === 'true')  val = true;
            if (val === 'false') val = false;
            if (col === 'price' || col === 'original_price') val = val ? parseFloat(val) : null;
            if (col === 'stock_count') val = val !== null ? parseInt(val) : 10;
            obj[col] = val;
        });
        return obj;
    }).filter(p => p.id);

    console.log(`📦 Importing ${products.length} products...`);

    let success = 0, failed = 0;
    for (let i = 0; i < products.length; i += 10) {
        const batch = products.slice(i, i + 10);
        const res   = await fetch(`${url}/rest/v1/products`, {
            method:  'POST',
            headers: { ...headers, 'Prefer': 'return=minimal,resolution=ignore-duplicates' },
            body:    JSON.stringify(batch),
        });
        if ([200, 201, 204].includes(res.status)) {
            success += batch.length;
            console.log(`   ✅ Batch ${Math.floor(i / 10) + 1}: ${batch.length} products`);
        } else {
            const err = await res.text();
            console.log(`   ❌ Batch ${Math.floor(i / 10) + 1} failed: ${err.slice(0, 200)}`);
            failed += batch.length;
        }
    }

    console.log(`\n✅ Done! ${success} inserted, ${failed} failed`);
    console.log(`📊 Products in DB now: ${await checkExisting()}`);
}

run().catch(console.error);
