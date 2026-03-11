
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function testItems() {
  console.log('Testing order_items insertion...');
  const { error } = await supabase
    .from('order_items')
    .insert({
        order_id: '550e8400-e29b-41d4-a716-446655440000',
        product_name: 'Test Item',
        quantity: 1,
        price_at_purchase: 100
    });

  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Successfully connected to order_items (or inserted if RLS allows).');
  }
}

testItems();
