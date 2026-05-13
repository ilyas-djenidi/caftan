/**
 * migrate_images.cjs
 * Downloads images from OLD Supabase (using service_role) → uploads to NEW Supabase.
 * Usage: node migrate_images.cjs NEW_SERVICE_KEY OLD_SERVICE_KEY
 */

const fs = require('fs');

const env = {};
fs.readFileSync('.env', 'utf-8').split('\n').forEach(l => {
    const i = l.indexOf('=');
    if (i > 0) {
        env[l.slice(0, i).trim()] = l.slice(i+1).trim().replace(/^["'](.*)["']$/, '$1');
    }
});

const OLD_URL = 'https://nsjyyivbpyexqvywymaz.supabase.co';
const NEW_URL = env.VITE_SUPABASE_URL;
const NEW_KEY = process.argv[2];
const OLD_KEY = process.argv[3];
const BUCKET = 'caftan-images';

if (!NEW_KEY || !OLD_KEY) {
    console.error('❌ Usage: node migrate_images.cjs NEW_SERVICE_KEY OLD_SERVICE_KEY');
    process.exit(1);
}

const uploadHeaders = {
    'apikey': NEW_KEY,
    'Authorization': `Bearer ${NEW_KEY}`,
};

const dbHeaders = {
    'apikey': NEW_KEY,
    'Authorization': `Bearer ${NEW_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
};

// Read product_images CSV to get all image records
const csv = fs.readFileSync('product_images_rows.csv', 'utf-8').split('\n');
const headers = csv[0].trim().split(',');
const images = csv.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = (vals[i] || '').trim());
    return obj;
}).filter(r => r.id && r.image_url);

console.log(`\n🖼  Found ${images.length} images to migrate\n`);

async function downloadBuffer(filename) {
    // Use old service_role key to download from old storage API (bypasses 402 quota)
    const url = `${OLD_URL}/storage/v1/object/caftan-images/products/${filename}`;
    const res = await fetch(url, {
        headers: {
            'apikey': OLD_KEY,
            'Authorization': `Bearer ${OLD_KEY}`
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from old storage`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
}

async function uploadToStorage(path, buffer, contentType = 'image/jpeg') {
    const url = `${NEW_URL}/storage/v1/object/${BUCKET}/${path}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            ...uploadHeaders,
            'Content-Type': contentType,
            'x-upsert': 'true',
        },
        body: buffer
    });
    const text = await res.text();
    if (res.status >= 200 && res.status < 300) {
        return `${NEW_URL}/storage/v1/object/public/${BUCKET}/${path}`;
    }
    throw new Error(`Upload failed (${res.status}): ${text.slice(0, 100)}`);
}

async function updateImageUrl(id, newUrl) {
    const res = await fetch(`${NEW_URL}/rest/v1/product_images?id=eq.${id}`, {
        method: 'PATCH',
        headers: dbHeaders,
        body: JSON.stringify({ image_url: newUrl })
    });
    if (res.status >= 300) {
        const t = await res.text();
        throw new Error(`DB update failed: ${t.slice(0,100)}`);
    }
}

async function run() {
    // 1. Create storage bucket first
    console.log('🪣 Creating storage bucket...');
    const bucketRes = await fetch(`${NEW_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers: { ...uploadHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true })
    });
    const bucketText = await bucketRes.text();
    if (bucketRes.status === 200 || bucketRes.status === 201) {
        console.log(`   ✅ Bucket '${BUCKET}' created`);
    } else if (bucketText.includes('already exists')) {
        console.log(`   ℹ️  Bucket '${BUCKET}' already exists`);
    } else {
        console.log(`   ⚠️  Bucket response: ${bucketText.slice(0,100)}`);
    }

    let success = 0, failed = 0;

    for (let idx = 0; idx < images.length; idx++) {
        const img = images[idx];
        const oldUrl = img.image_url;
        
        // Extract filename from URL
        const filename = oldUrl.split('/').pop();
        const storagePath = `products/${filename}`;

        process.stdout.write(`[${idx+1}/${images.length}] ${filename} ... `);
        
        try {
            // Download from old URL
            const buffer = await downloadBuffer(filename);
            
            // Upload to new storage
            const newUrl = await uploadToStorage(storagePath, buffer);
            
            // Update DB record
            await updateImageUrl(img.id, newUrl);
            
            success++;
            console.log(`✅`);
        } catch (e) {
            failed++;
            console.log(`❌ ${e.message.slice(0, 60)}`);
        }
    }

    console.log(`\n✅ Done! ${success} migrated, ${failed} failed`);
    console.log(`\n🔗 New image base URL: ${NEW_URL}/storage/v1/object/public/${BUCKET}/products/`);
}

run().catch(console.error);
