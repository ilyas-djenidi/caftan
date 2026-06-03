#!/usr/bin/env node
'use strict';

/**
 * 🔍 Database Connection Diagnostic Script
 * استخدم هذا لتشخيص مشاكل الاتصال بسرعة
 */

require('dotenv').config();

console.log('\n🔧 DATABASE DIAGNOSTICS\n');
console.log('='.repeat(60));

// 1. Check environment variables
console.log('\n1️⃣  ENVIRONMENT VARIABLES:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || '(not set)'}`);
console.log(`   DB_HOST: ${process.env.DB_HOST || '(not set)'}`);
console.log(`   DB_PORT: ${process.env.DB_PORT || '(not set)'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || '(not set)'}`);
console.log(`   DB_USER: ${process.env.DB_USER || '(not set)'}`);
console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '(set, length=' + process.env.DB_PASSWORD.length + ')' : '(not set)'}`);

// 2. Validate env
console.log('\n2️⃣  VALIDATION:');
const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER'];
let valid = true;
for (const key of required) {
  if (!process.env[key]) {
    console.log(`   ❌ ${key} is missing!`);
    valid = false;
  } else {
    console.log(`   ✓ ${key} is set`);
  }
}

if (!valid) {
  console.error('\n❌ Missing required environment variables!\n');
  process.exit(1);
}

// 3. Try direct connection
console.log('\n3️⃣  CONNECTION TEST (direct):');

const { Pool } = require('pg');
const testPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
  connectionTimeoutMillis: 10000,
});

(async () => {
  try {
    console.log(`   Connecting to ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}...`);
    
    const client = await testPool.connect();
    console.log('   ✓ Connected!');
    
    const result = await client.query('SELECT NOW() as time, version() as version');
    console.log(`   ✓ Query successful`);
    console.log(`   Database time: ${result.rows[0].time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(',')[0]}`);
    
    client.release();
    
    // 4. Try with env.js
    console.log('\n4️⃣  USING env.js module:');
    const env = require('./backend/src/config/env');
    console.log(`   env.db.host: ${env.db.host}`);
    console.log(`   env.db.user: ${env.db.user}`);
    console.log(`   env.db.database: ${env.db.database}`);
    console.log(`   env.db.poolMax: ${env.db.poolMax}`);
    
    // 5. Try with database.js pool
    console.log('\n5️⃣  USING database.js pool:');
    const { pool } = require('./backend/src/config/database');
    const poolResult = await pool.query('SELECT 1 as ok');
    console.log(`   ✓ Pool connection successful`);
    
    await pool.end();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!\n');
    process.exit(0);
    
  } catch (err) {
    console.error(`\n❌ Connection failed:`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Code: ${err.code}`);
    console.error(`   Details:`, err);
    
    console.log('\n' + '='.repeat(60));
    console.log('❌ TROUBLESHOOTING TIPS:\n');
    console.log('1. PostgreSQL is running? (Windows: Services → postgres)');
    console.log('2. Network accessible? (ping host, check firewall)');
    console.log('3. Credentials correct? (DB_USER, DB_PASSWORD)');
    console.log('4. Database exists? (psql -l)');
    console.log('5. User has permissions? (psql -U user -d dbname -c "SELECT 1")');
    console.log();
    
    process.exit(1);
  }
})();
