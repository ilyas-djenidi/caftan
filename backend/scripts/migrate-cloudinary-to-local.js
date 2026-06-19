'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'caftan_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: false,
});

const UPLOADS_BASE = path.join(__dirname, '../uploads');

// Helper to determine folder from URL path
const determineFolder = (url) => {
  if (url.includes('/packs/')) return 'packs';
  if (url.includes('/hero/')) return 'hero';
  if (url.includes('/accessories/')) return 'accessories';
  return 'products'; // Default folder
};

async function downloadAndSave(url, folder) {
  // Extract filename from URL (e.g. uuid.webp)
  const filename = url.split('/').pop().split('?')[0];
  const targetDir = path.join(UPLOADS_BASE, folder);
  const targetPath = path.join(targetDir, filename);

  // Ensure directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Download image buffer
  console.log(`  Downloading: ${url}`);
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'arraybuffer',
    timeout: 15000, // 15s timeout
  });

  fs.writeFileSync(targetPath, response.data);
  console.log(`  ✓ Saved: ${targetPath}`);

  // Return relative URL for DB storage
  return `/uploads/${folder}/${filename}`;
}

async function startMigration() {
  const client = await pool.connect();
  let migratedCount = 0;
  let failedCount = 0;

  try {
    console.log('--- Starting Cloudinary-to-Local Migration ---');

    // 1. Migrate product_images
    console.log('\nScanning product_images...');
    const productImgs = await client.query(
      "SELECT id, image_url FROM product_images WHERE image_url LIKE '%res.cloudinary.com%'"
    );
    console.log(`Found ${productImgs.rows.length} product images to migrate.`);

    for (const row of productImgs.rows) {
      try {
        const folder = determineFolder(row.image_url);
        const relativePath = await downloadAndSave(row.image_url, folder);
        
        await client.query(
          'UPDATE product_images SET image_url = $1 WHERE id = $2',
          [relativePath, row.id]
        );
        console.log(`  ✓ Updated DB product_images ID ${row.id}`);
        migratedCount++;
      } catch (err) {
        console.error(`  ✗ Failed to migrate product_images ID ${row.id}: ${err.message}`);
        failedCount++;
      }
    }

    // 2. Migrate packs
    console.log('\nScanning packs...');
    const packs = await client.query(
      "SELECT id, image_url FROM packs WHERE image_url LIKE '%res.cloudinary.com%'"
    );
    console.log(`Found ${packs.rows.length} packs to migrate.`);

    for (const row of packs.rows) {
      try {
        const folder = 'packs';
        const relativePath = await downloadAndSave(row.image_url, folder);
        
        await client.query(
          'UPDATE packs SET image_url = $1 WHERE id = $2',
          [relativePath, row.id]
        );
        console.log(`  ✓ Updated DB packs ID ${row.id}`);
        migratedCount++;
      } catch (err) {
        console.error(`  ✗ Failed to migrate packs ID ${row.id}: ${err.message}`);
        failedCount++;
      }
    }

    // 3. Migrate hero_banners
    console.log('\nScanning hero_banners...');
    const heroSlides = await client.query(
      "SELECT id, image_url FROM hero_banners WHERE image_url LIKE '%res.cloudinary.com%'"
    );
    console.log(`Found ${heroSlides.rows.length} hero banners to migrate.`);

    for (const row of heroSlides.rows) {
      try {
        const folder = 'hero';
        const relativePath = await downloadAndSave(row.image_url, folder);
        
        await client.query(
          'UPDATE hero_banners SET image_url = $1 WHERE id = $2',
          [relativePath, row.id]
        );
        console.log(`  ✓ Updated DB hero_banners ID ${row.id}`);
        migratedCount++;
      } catch (err) {
        console.error(`  ✗ Failed to migrate hero_banners ID ${row.id}: ${err.message}`);
        failedCount++;
      }
    }

    console.log('\n--- Migration Finished ---');
    console.log(`Successfully migrated: ${migratedCount} images`);
    console.log(`Failed: ${failedCount} images`);

  } finally {
    client.release();
    await pool.end();
  }
}

startMigration().catch((err) => {
  console.error('Fatal migration error:', err.message);
  process.exit(1);
});
