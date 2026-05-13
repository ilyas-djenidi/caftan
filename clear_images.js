import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearOldImages() {
    console.log('Clearing old broken images...');

    // 1. Delete all product images
    const { error: piError } = await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (piError) {
        console.error('Error deleting product images:', piError);
    } else {
        console.log('✅ Deleted all product images');
    }

    // 2. Clear pack images
    const { error: packError } = await supabase.from('packs').update({ image_url: null }).neq('id', '00000000-0000-0000-0000-000000000000');
    if (packError) {
        console.error('Error clearing pack images:', packError);
    } else {
        console.log('✅ Cleared pack images');
    }

    // 3. Clear hero banner images
    const { error: heroError } = await supabase.from('hero_banners').update({ image_url: null }).neq('id', 0);
    if (heroError) {
        console.error('Error clearing hero banners:', heroError);
    } else {
        console.log('✅ Cleared hero banner images');
    }

    console.log('Done!');
}

clearOldImages();
