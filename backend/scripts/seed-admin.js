'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'caftan_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log(`Admin "${email}" already exists. Updating password...`);
      const hash = await bcrypt.hash(password, 12);
      await client.query('UPDATE admins SET password_hash = $1 WHERE email = $2', [hash, email]);
      console.log('Password updated.');
    } else {
      const hash = await bcrypt.hash(password, 12);
      await client.query(
        `INSERT INTO admins (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'superadmin')`,
        [email, hash, name]
      );
      console.log(`Admin "${email}" created successfully.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

seedAdmin().catch((err) => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
