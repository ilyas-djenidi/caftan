import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf-8');
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
    const { data, error } = await supabase.from('product_attributes').insert([{ 
        product_id: '12345678-1234-1234-1234-123456789012', 
        type: 'model', 
        value: '1', 
        label: '1', 
        is_available: true 
    }]);
    
    console.log("INSERTION ERROR:", JSON.stringify(error, null, 2));
}

main();
