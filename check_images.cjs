const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf-8').split('\n').forEach(l => {
    const i = l.indexOf('=');
    if (i > 0) {
        const k = l.slice(0, i).trim();
        const v = l.slice(i+1).trim().replace(/^["'](.*)["']$/, '$1');
        env[k] = v;
    }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const h = { 'apikey': key, 'Authorization': `Bearer ${key}` };

async function run() {
    // Check product_images
    const r1 = await fetch(`${url}/rest/v1/product_images?select=id`, { headers: { ...h, 'Prefer': 'count=exact' } });
    console.log('product_images count:', r1.headers.get('content-range'));
    const imgs = await r1.json();
    console.log('product_images sample:', Array.isArray(imgs) ? imgs.slice(0,2) : imgs);
    
    // Check products with images join
    const r2 = await fetch(`${url}/rest/v1/products?select=id,name_fr,is_visible,images:product_images(image_url)&limit=3`, { headers: h });
    const prods = await r2.json();
    console.log('\nProducts with images join:');
    if (Array.isArray(prods)) {
        prods.forEach(p => console.log(`  ${p.name_fr}: images=${JSON.stringify(p.images)}, is_visible=${p.is_visible}`));
    } else {
        console.log('Error:', JSON.stringify(prods));
    }
}

run().catch(console.error);
