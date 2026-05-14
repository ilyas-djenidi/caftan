/**
 * seed_db.js
 * Seeds products from local images.
 * Run from project root: node scripts/seed_db.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length) {
        env[key.trim()] = value.join('=').trim().replace(/^["'](.*)["']$/, '$1');
    }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Supabase URL or Key missing in .env');
    process.exit(1);
}

const supabase = createClient(url, key);

async function seed() {
    try {
        console.log('--- Database Reset Start ---');

        console.log('Deleting all products...');
        const { error: delError } = await supabase
            .from('products')
            .delete()
            .neq('name_fr', 'KEEP_NOTHING');

        if (delError) {
            console.warn('Error deleting products:', delError.message);
        }

        const categories = {
            'caftan': 'caftans',
            'accessories': 'accessoires',
            'sac': 'sacs'
        };

        const baseDir = path.join(ROOT, 'products');

        for (const [dirName, categoryName] of Object.entries(categories)) {
            const dirPath = path.join(baseDir, dirName);
            if (!fs.existsSync(dirPath)) {
                console.log(`Directory ${dirName} not found, skipping...`);
                continue;
            }

            const files = fs.readdirSync(dirPath).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
            console.log(`\nFound ${files.length} images in ${dirName}`);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const filePath = path.join(dirPath, file);
                const fileBuffer = fs.readFileSync(filePath);

                const fileExt = file.split('.').pop();
                const storageFileName = `${dirName}_${Date.now()}_${i}.${fileExt}`;
                const storagePath = `products/${storageFileName}`;

                console.log(`[${i + 1}/${files.length}] Uploading ${file}...`);

                const { error: uploadError } = await supabase.storage
                    .from('caftan-images')
                    .upload(storagePath, fileBuffer, {
                        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`  Upload failed:`, uploadError.message);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('caftan-images')
                    .getPublicUrl(storagePath);

                console.log(`  Creating product record...`);

                const productName = `${categoryName} Premium #${i + 1}`;
                const productData = {
                    name_fr: productName,
                    category: categoryName,
                    price: 18000 + (Math.floor(Math.random() * 10) * 1000),
                    description_fr: `Magnifique ${categoryName.toLowerCase()} de notre nouvelle collection. Qualité supérieure et finition artisanale.`,
                    in_stock: true,
                    stock_count: 5,
                    is_visible: true,
                    featured: i < 3
                };

                const { data: product, error: prodError } = await supabase
                    .from('products')
                    .insert(productData)
                    .select()
                    .single();

                if (prodError) {
                    console.error(`  Product insert failed:`, prodError.message);
                    continue;
                }

                const { error: imgError } = await supabase
                    .from('product_images')
                    .insert({
                        product_id: product.id,
                        image_url: publicUrl,
                        is_primary: true,
                        display_order: 0
                    });

                if (imgError) {
                    console.error(`  Image link failed:`, imgError.message);
                } else {
                    console.log(`  Done: ${productName}`);
                }
            }
        }

        console.log('\n--- Hero Section Setup ---');
        const heroImagePath = path.join(baseDir, 'caftan', 'photo_1_2026-03-01_04-18-20.jpg');
        if (fs.existsSync(heroImagePath)) {
            console.log('Uploading hero background...');
            const heroBuffer = fs.readFileSync(heroImagePath);
            const heroStoragePath = `hero/main_bg_${Date.now()}.jpg`;

            const { error: heroUploadError } = await supabase.storage
                .from('caftan-images')
                .upload(heroStoragePath, heroBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (!heroUploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('caftan-images')
                    .getPublicUrl(heroStoragePath);

                console.log('Updating hero content in site_settings...');
                const heroContent = {
                    title_fr: 'Maison du Caftans',
                    subtitle_fr: 'L’excellence du savoir-faire traditionnel au service de votre élégance.',
                    cta_text_fr: 'DÉCOUVRIR LA COLLECTION',
                    image_url: publicUrl
                };

                await supabase.from('site_settings').upsert({
                    key: 'hero_content',
                    value: heroContent,
                    updated_at: new Date().toISOString()
                });
                console.log('  Hero setup done.');
            } else {
                console.error('  Hero upload failed:', heroUploadError.message);
            }
        }

        console.log('\n--- Seeding Completed Successfully ---');
    } catch (err) {
        console.error('Fatal seeding error:', err);
    }
}

seed();
