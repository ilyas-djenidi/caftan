/**
 * mark_featured.js
 * Marks products as featured.
 * Run from project root: node scripts/mark_featured.js
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
    if (key && value.length) env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase
        .from('products')
        .update({ featured: true })
        .neq('id', 0);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('All products marked as featured!');
    }

    const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true);
    console.log(`Featured product count: ${count}`);
}

run();
