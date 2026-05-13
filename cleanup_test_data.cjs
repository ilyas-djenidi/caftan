const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    const value = rest.join('=');
    if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^["'](.*)["']$/, '$1');
    }
});

const url = envVars.VITE_SUPABASE_URL;
const key = envVars.VITE_SUPABASE_ANON_KEY;

const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

async function del(table, filter) {
    const res = await fetch(`${url}/rest/v1/${table}?${filter}`, { method: 'DELETE', headers });
    const text = await res.text();
    console.log(`DELETE ${table} [${filter}]: ${res.status} ${text.slice(0, 100)}`);
}

async function run() {
    console.log('🧹 Cleaning up test data...\n');

    // First find the test order IDs
    const ordRes = await fetch(`${url}/rest/v1/orders?customer_phone=eq.0555123456&select=id`, { headers });
    const orders = await ordRes.json();

    if (orders.length > 0) {
        const ids = orders.map(o => o.id).join(',');
        await del('order_items', `order_id=in.(${ids})`);
    }
    await del('orders', 'customer_phone=eq.0555123456');

    // Delete test message (email = test@test.com)
    await del('messages', 'email=eq.test%40test.com');

    // Delete test review (author_name = Test Reviewer)
    await del('reviews', 'author_name=eq.Test%20Reviewer');

    console.log('\n✅ Cleanup complete!');
}

run().catch(console.error);
