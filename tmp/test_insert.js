
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

async function testInsert() {
  console.log('Testing order insertion...');
  const orderId = 'test-order-' + Date.now();
  const { data, error } = await supabase
    .from('orders')
    .insert({
        id: crypto.randomUUID ? crypto.randomUUID() : '550e8400-e29b-41d4-a716-446655440000',
        order_number: 'TEST-' + Math.floor(Math.random() * 10000),
        customer_name: 'Test User',
        customer_phone: '0600000000',
        shipping_address: 'Test Address',
        wilaya: 'Alger',
        city: 'Alger',
        delivery_type: 'home',
        status: 'pending',
        total_price: 1000
    })
    .select();

  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Successfully inserted test order:', data);
    // Cleanup
    await supabase.from('orders').delete().eq('id', data[0].id);
    console.log('Cleanup: Test order deleted.');
  }
}

testInsert();
