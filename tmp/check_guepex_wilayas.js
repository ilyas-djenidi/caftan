
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
const PROXY_URL = `${env.VITE_SUPABASE_URL}/functions/v1/guepex-proxy`;

async function checkWilayas() {
  const endpoint = '/wilayas/?page_size=5';
  const proxyUrl = `${PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}`;
  
  const res = await fetch(proxyUrl, {
    headers: {
      'apikey': env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
    }
  });
  
  const data = await res.json();
  console.log('Sample Wilayas from Guepex:');
  console.log(JSON.stringify(data, null, 2));
}

checkWilayas();
