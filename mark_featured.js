import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length) env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    // Mark all products as featured so they show in "Sélection Exclusive"
    const { data, error } = await supabase
        .from('products')
        .update({ featured: true })
        .neq('id', 0);      // matches all rows

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('All products marked as featured!');
    }

    // Verify
    const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true);
    console.log(`Featured product count: ${count}`);
}

run();
