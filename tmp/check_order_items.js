import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').filter(Boolean).forEach(line => {
  const parts = line.split('=');
  const dkey = parts[0].trim();
  const dval = parts.slice(1).join('=').trim().replace(/^['\"]|['\"]$/g, '');
  if(dkey) env[dkey] = dval;
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
(async () => {
    const { data: cols, error } = await supabase.from('order_items').select('*').limit(1);
    if (error) {
        console.error('Error fetching order_items cols:', error.message);
    } else {
        console.log('order_items cols:', cols && cols.length > 0 ? Object.keys(cols[0]) : 'no-data (empty)');
    }
    process.exit(0);
})();
