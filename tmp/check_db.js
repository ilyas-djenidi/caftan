import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if(parts.length >= 2) {
    const k = parts.shift().trim();
    const v = parts.join('=').trim().replace(/^['"]|['"]$/g, '');
    if(k) env[k] = v;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function main() {
    // 1. Try to insert the 'model' attribute to a dummy uuid (doesn't matter if it fails fk, we want the constraint error)
    const { error } = await supabase.from('product_attributes').insert([{ 
        product_id: '00000000-0000-0000-0000-000000000000', 
        type: 'model', 
        value: '1', 
        label: '1', 
        is_available: true 
    }]);
    
    console.log("INSERTION ERROR:", error);
}

main();
