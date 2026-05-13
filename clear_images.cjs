const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^["'](.*)["']$/, '$1');
    }
});

const url = envVars.VITE_SUPABASE_URL.replace(/^["'](.*)["']$/, '$1');
const key = envVars.VITE_SUPABASE_ANON_KEY.replace(/^["'](.*)["']$/, '$1');

async function run() {
    console.log('Clearing old broken images...');

    // Delete product images
    const r1 = await fetch(`${url}/rest/v1/product_images?id=not.eq.00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    console.log('Product images deleted:', r1.status);

    // Clear pack images
    const r2 = await fetch(`${url}/rest/v1/packs?id=not.eq.00000000-0000-0000-0000-000000000000`, {
        method: 'PATCH',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_url: null })
    });
    console.log('Pack images cleared:', r2.status);

    // Clear order items images
    const r3 = await fetch(`${url}/rest/v1/order_items?id=not.eq.00000000-0000-0000-0000-000000000000`, {
        method: 'PATCH',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_image: null })
    });
    console.log('Order items images cleared:', r3.status);

    console.log('Done!');
}

run();
