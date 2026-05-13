const fs = require('fs');

// Read .env
const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    const value = rest.join('=');
    if (key && value) envVars[key.trim()] = value.trim().replace(/^["'](.*)["']$/, '$1');
});

const url = envVars.VITE_SUPABASE_URL;
const key = envVars.VITE_SUPABASE_ANON_KEY;

const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

// Read and parse CSV properly (handles quoted multiline fields)
function parseCSV(text) {
    const rows = [];
    let inQuote = false;
    let field = '';
    let row = [];
    
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i+1];
        
        if (ch === '"') {
            if (inQuote && next === '"') { field += '"'; i++; }
            else inQuote = !inQuote;
        } else if (ch === ',' && !inQuote) {
            row.push(field); field = '';
        } else if ((ch === '\n' || (ch === '\r' && next === '\n')) && !inQuote) {
            if (ch === '\r') i++;
            row.push(field); field = '';
            rows.push(row); row = [];
        } else {
            field += ch;
        }
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
}

async function checkExisting() {
    const res = await fetch(`${url}/rest/v1/products?select=id&limit=1`, { headers });
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
}

async function run() {
    console.log('🔍 Checking existing products in new DB...');
    const existing = await checkExisting();
    console.log(`   Found ${existing} products in DB\n`);
    
    console.log('📂 Reading products_rows.csv...');
    const csvText = fs.readFileSync('products_rows.csv', 'utf-8');
    const rows = parseCSV(csvText);
    
    const headers_csv = rows[0];
    console.log(`   CSV columns: ${headers_csv.join(', ')}\n`);
    console.log(`   Total rows: ${rows.length - 1}\n`);
    
    const products = rows.slice(1).map(row => {
        const obj = {};
        headers_csv.forEach((col, i) => {
            let val = row[i] || null;
            // Handle null string
            if (val === 'null' || val === '') val = null;
            // Parse booleans
            if (val === 'true') val = true;
            if (val === 'false') val = false;
            // Parse numbers
            if (col === 'price' || col === 'original_price') {
                val = val ? parseFloat(val) : null;
            }
            if (col === 'stock_count') {
                val = val !== null ? parseInt(val) : 10;
            }
            obj[col] = val;
        });
        return obj;
    }).filter(p => p.id); // Only valid rows
    
    console.log(`📦 Importing ${products.length} products...`);
    
    // Insert in batches of 10
    let success = 0, failed = 0;
    for (let i = 0; i < products.length; i += 10) {
        const batch = products.slice(i, i + 10);
        const res = await fetch(`${url}/rest/v1/products`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal,resolution=ignore-duplicates' },
            body: JSON.stringify(batch)
        });
        
        if (res.status === 200 || res.status === 201 || res.status === 204) {
            success += batch.length;
            console.log(`   ✅ Batch ${Math.floor(i/10)+1}: inserted ${batch.length} products`);
        } else {
            const err = await res.text();
            console.log(`   ❌ Batch ${Math.floor(i/10)+1} failed: ${err.slice(0, 200)}`);
            failed += batch.length;
        }
    }
    
    console.log(`\n✅ Done! ${success} inserted, ${failed} failed`);
    
    // Verify
    const final = await checkExisting();
    console.log(`📊 Products in DB now: ${final}`);
}

run().catch(console.error);
