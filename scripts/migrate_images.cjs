/**
 * migrate_images.cjs
 * Downloads images from OLD Supabase → uploads to NEW Supabase.
 * Usage: node scripts/migrate_images.cjs NEW_SERVICE_KEY OLD_SERVICE_KEY
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

const OLD_URL = 'https://nsjyyivbpyexqvywymaz.supabase.co';
const NEW_URL = env.VITE_SUPABASE_URL;
const NEW_KEY = process.argv[2];
const OLD_KEY = process.argv[3];
const BUCKET  = 'caftan-images';

if (!NEW_KEY || !OLD_KEY) {
    console.error('❌ Usage: node scripts/migrate_images.cjs NEW_SERVICE_KEY OLD_SERVICE_KEY');
    process.exit(1);
}

const uploadHeaders = {
    'apikey':        NEW_KEY,
    'Authorization': `Bearer ${NEW_KEY}`,
};
const dbHeaders = {
    'apikey':        NEW_KEY,
    'Authorization': `Bearer ${NEW_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=minimal',
};

// Read product_images CSV from data/
const csv     = fs.readFileSync(path.join(DATA_DIR, 'product_images_rows.csv'), 'utf-8').split('\n');
const headers = csv[0].trim().split(',');
const images  = csv.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(',');
    const obj  = {};
    headers.forEach((h, i) => obj[h.trim()] = (vals[i] || '').trim());
    return obj;
}).filter(r => r.id && r.image_url);

console.log(`\n🖼  Found ${images.length} images to migrate\n`);

async function downloadBuffer(filename) {
    const url = `${OLD_URL}/storage/v1/object/caftan-images/products/${filename}`;
    const res = await fetch(url, { headers: { 'apikey': OLD_KEY, 'Authorization': `Bearer ${OLD_KEY}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status} from old storage`);
    return Buffer.from(await res.arrayBuffer());
}

async function uploadToStorage(storagePath, buffer) {
    const url = `${NEW_URL}/storage/v1/object/${BUCKET}/${storagePath}`;
    const res = await fetch(url, {
        method:  'POST',
        headers: { ...uploadHeaders, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
        body:    buffer,
    });
    const text = await res.text();
    if (res.status >= 200 && res.status < 300)
        return `${NEW_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    throw new Error(`Upload failed (${res.status}): ${text.slice(0, 100)}`);
}

async function updateImageUrl(id, newUrl) {
    const res = await fetch(`${NEW_URL}/rest/v1/product_images?id=eq.${id}`, {
        method:  'PATCH',
        headers: dbHeaders,
        body:    JSON.stringify({ image_url: newUrl }),
    });
    if (res.status >= 300) {
        const t = await res.text();
        throw new Error(`DB update failed: ${t.slice(0, 100)}`);
    }
}

async function run() {
    // Create storage bucket
    console.log('🪣 Creating storage bucket...');
    const bucketRes  = await fetch(`${NEW_URL}/storage/v1/bucket`, {
        method:  'POST',
        headers: { ...uploadHeaders, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    });
    const bucketText = await bucketRes.text();
    if (bucketRes.status === 200 || bucketRes.status === 201)
        console.log(`   ✅ Bucket '${BUCKET}' created`);
    else if (bucketText.includes('already exists'))
        console.log(`   ℹ️  Bucket '${BUCKET}' already exists`);
    else
        console.log(`   ⚠️  Bucket response: ${bucketText.slice(0, 100)}`);

    let success = 0, failed = 0;

    for (let idx = 0; idx < images.length; idx++) {
        const img         = images[idx];
        const filename    = img.image_url.split('/').pop();
        const storagePath = `products/${filename}`;

        process.stdout.write(`[${idx + 1}/${images.length}] ${filename} ... `);
        try {
            const buffer = await downloadBuffer(filename);
            const newUrl = await uploadToStorage(storagePath, buffer);
            await updateImageUrl(img.id, newUrl);
            success++;
            console.log('✅');
        } catch (e) {
            failed++;
            console.log(`❌ ${e.message.slice(0, 60)}`);
        }
    }

    console.log(`\n✅ Done! ${success} migrated, ${failed} failed`);
}

run().catch(console.error);
