const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf-8').split('\n').forEach(l => {
    const i = l.indexOf('=');
    if (i > 0) {
        env[l.slice(0, i).trim()] = l.slice(i+1).trim().replace(/^["'](.*)["']$/, '$1');
    }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const h = {
    'apikey': key, 
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal,resolution=ignore-duplicates'
};

function parseCSVSimple(text, stripCols = []) {
    const lines = text.split('\n');
    const headers = lines[0].trim().split(',');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, idx) => {
            const col = h.trim();
            if (stripCols.includes(col)) return; // skip unwanted cols
            let v = values[idx] || null;
            if (v === 'null' || v === '') v = null;
            if (v === 'true') v = true;
            if (v === 'false') v = false;
            if (col === 'display_order' || col === 'stock') v = v !== null ? parseInt(v) : 0;
            obj[col] = v;
        });
        if (obj.id) rows.push(obj);
    }
    return rows;
}

async function importTable(csvFile, tableName, label, stripCols = []) {
    console.log(`\n📂 Importing ${label}...`);
    const text = fs.readFileSync(csvFile, 'utf-8');
    const rows = parseCSVSimple(text, stripCols);
    console.log(`   ${rows.length} rows found`);
    
    let success = 0, failed = 0;
    for (let i = 0; i < rows.length; i += 20) {
        const batch = rows.slice(i, i + 20);
        const res = await fetch(`${url}/rest/v1/${tableName}`, {
            method: 'POST',
            headers: h,
            body: JSON.stringify(batch)
        });
        if (res.status >= 200 && res.status < 300) {
            success += batch.length;
        } else {
            const err = await res.text();
            console.log(`   ❌ Batch error: ${err.slice(0, 150)}`);
            failed += batch.length;
        }
    }
    console.log(`   ✅ ${success} inserted, ${failed} failed`);
    return success;
}

async function run() {
    console.log('🚀 Starting full data import into new Supabase DB...');
    console.log('URL:', url.slice(0, 40) + '...\n');

    // 1. product_images (already imported, skip if exists)
    // await importTable('product_images_rows.csv', 'product_images', 'Product Images');

    // 2. product_attributes - strip 'is_available' (not in new schema)
    if (fs.existsSync('product_attributes_rows.csv')) {
        await importTable('product_attributes_rows.csv', 'product_attributes', 'Product Attributes', ['is_available', 'label', 'display_order', 'stock', 'hex_color', 'image_url']);
    }

    // 3. Verify product_images
    const r = await fetch(`${url}/rest/v1/product_images?select=id`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'count=exact' }
    });
    console.log(`\n📊 product_images in DB: ${r.headers.get('content-range')}`);

    console.log('\n✅ Import complete!');
}

run().catch(console.error);
