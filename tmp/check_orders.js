
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env file
function getEnv() {
  const envPath = path.resolve('c:/Users/HP/Desktop/projects/caftan/.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      // Strip quotes if they exist
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      env[key] = value;
    }
  });
  return env;
}

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
  console.log(`Checking orders table at ${supabaseUrl}...`);
  const { data, count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error fetching orders:', error);
  } else {
    console.log(`Successfully connected. Found ${count} orders.`);
    if (data && data.length > 0) {
      console.log('Last 5 orders:');
      data.slice(0, 5).forEach(o => {
        console.log(`- #${o.order_number} | Status: ${o.status} | Tracking: ${o.guepex_tracking_id || 'none'}`);
      });
    } else {
      console.log('Table is empty.');
    }
  }
}

checkOrders();
