const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx+1).trim().replace(/^["'](.*)["']$/, '$1');
        envVars[key] = value;
    }
});

const url = envVars.VITE_SUPABASE_URL;
const key = envVars.VITE_SUPABASE_ANON_KEY;

const h = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Prefer': 'count=exact'
};

fetch(`${url}/rest/v1/products?select=id`, { headers: h })
    .then(r => {
        console.log('Content-Range:', r.headers.get('content-range'));
        return r.json();
    })
    .then(d => {
        console.log('Products returned:', Array.isArray(d) ? d.length : JSON.stringify(d).slice(0,100));
    })
    .catch(console.error);
