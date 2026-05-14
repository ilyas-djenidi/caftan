import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
    try {
        const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'hero_content').maybeSingle();
        
        const heroData = data?.value || {
            title_fr: 'Maison du Caftans',
            subtitle_fr: 'L’excellence du savoir-faire traditionnel au service de votre élégance.',
            cta_text_fr: 'DÉCOUVRIR LA COLLECTION'
        };

        heroData.image_url = '/images/caftan/photo_1_2026-03-01_04-18-20.jpg';

        const { error: upsertError } = await supabase.from('site_settings').upsert({
            key: 'hero_content',
            value: heroData,
            updated_at: new Date().toISOString()
        });

        if (upsertError) throw upsertError;
        console.log("Successfully updated hero image to local file!");
    } catch (e) {
        console.error(e);
    }
}

main();
