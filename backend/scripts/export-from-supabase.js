#!/usr/bin/env node
/**
 * export-from-supabase.js
 *
 * 1. Reads CSV exports in data/ for the main tables
 * 2. Fetches missing tables (promo_codes, reviews, hero_banners,
 *    site_settings, shipments) from Supabase REST API
 * 3. Downloads all images from Supabase Storage → backend/uploads/
 * 4. Rewrites image URLs to local /uploads/... paths
 * 5. Generates backend/migrations/002_seed_data.sql
 *
 * Run from project root:
 *   node backend/scripts/export-from-supabase.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');
const { URL } = require('url');

// ─── config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://dpnttpriwkxddhrxntgu.supabase.co';
const SUPABASE_STORAGE = 'https://nsjyyivbpyexqvywymaz.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbnR0cHJpd2t4ZGRocnhudGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NzM2NjksImV4cCI6MjA5NDI0OTY2OX0.HNlIiS9h_FS0oIZENrJiV-ohwpb3qVK1C-uQahoRyvk';

const ROOT        = path.resolve(__dirname, '..', '..');
const DATA_DIR    = path.join(ROOT, 'data');
const UPLOADS_DIR = path.join(ROOT, 'backend', 'uploads');
const OUT_SQL     = path.join(ROOT, 'backend', 'migrations', '002_seed_data.sql');

// ─── helpers ─────────────────────────────────────────────────────────────────

function log(msg) { process.stdout.write(`[export] ${msg}\n`); }
function warn(msg) { process.stderr.write(`[WARN]   ${msg}\n`); }

/** Escape a string value for PostgreSQL single-quote literal */
function esc(v) {
  if (v === null || v === undefined || v === '' || v === 'null' || v === 'NULL') return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function escBool(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (String(v).toLowerCase() === 'true' || v === '1') return 'TRUE';
  if (String(v).toLowerCase() === 'false' || v === '0') return 'FALSE';
  return 'NULL';
}

function escNum(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  const n = parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? 'NULL' : String(n);
}

function escInt(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  const n = parseInt(String(v), 10);
  return isNaN(n) ? 'NULL' : String(n);
}

/** Rewrite a Supabase storage URL to a local /uploads/... path */
function rewriteUrl(url) {
  if (!url || url === 'NULL') return null;
  // https://nsjyyivbpyexqvywymaz.supabase.co/storage/v1/object/public/caftan-images/products/file.jpg
  const match = url.match(/\/caftan-images\/(.+)$/);
  if (match) return '/uploads/' + match[1];
  // If it's already a local path, keep it
  if (url.startsWith('/uploads/')) return url;
  return url;
}

/** Extract just the filename from a storage URL */
function storageFilename(url) {
  if (!url) return null;
  try { return new URL(url).pathname.split('/').pop(); } catch { return null; }
}

/** Extract the subfolder + filename portion from storage URL */
function storageRelPath(url) {
  if (!url) return null;
  const match = url.match(/\/caftan-images\/(.+)$/);
  return match ? match[1] : null;
}

// ─── HTTP download helper ─────────────────────────────────────────────────────

function downloadFile(urlStr, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) { resolve(false); return; } // already downloaded
    const dir = path.dirname(destPath);
    fs.mkdirSync(dir, { recursive: true });
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const tmpPath = destPath + '.tmp';
    const file = fs.createWriteStream(tmpPath);
    const req = client.get(urlStr, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(tmpPath);
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(tmpPath);
        reject(new Error(`HTTP ${res.statusCode} for ${urlStr}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          fs.renameSync(tmpPath, destPath);
          resolve(true);
        });
      });
    });
    req.on('error', (e) => {
      file.close();
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      reject(e);
    });
    req.setTimeout(30000, () => { req.destroy(new Error('timeout')); });
  });
}

// ─── Supabase REST fetch ──────────────────────────────────────────────────────

function fetchSupabaseTable(table, extra = '') {
  return new Promise((resolve, reject) => {
    const urlStr = `${SUPABASE_URL}/rest/v1/${table}?select=*${extra}&limit=10000`;
    const parsed = new URL(urlStr);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    };
    let data = '';
    const req = https.get(options, (res) => {
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) resolve(parsed);
          else { warn(`${table}: ${JSON.stringify(parsed)}`); resolve([]); }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
  });
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const rows = [];
  let i = 0, n = raw.length;

  function parseField() {
    if (i >= n) return '';
    if (raw[i] === '"') {
      i++; // skip opening quote
      let val = '';
      while (i < n) {
        if (raw[i] === '"') {
          if (raw[i + 1] === '"') { val += '"'; i += 2; } // escaped quote
          else { i++; break; } // closing quote
        } else {
          val += raw[i++];
        }
      }
      return val;
    }
    let val = '';
    while (i < n && raw[i] !== ',' && raw[i] !== '\n' && raw[i] !== '\r') {
      val += raw[i++];
    }
    return val;
  }

  function parseLine() {
    const fields = [];
    while (i < n) {
      fields.push(parseField());
      if (i < n && raw[i] === ',') { i++; continue; }
      break;
    }
    // skip \r\n or \n
    if (i < n && raw[i] === '\r') i++;
    if (i < n && raw[i] === '\n') i++;
    return fields;
  }

  const headers = parseLine();
  while (i < n) {
    if (raw[i] === '\r' || raw[i] === '\n') { i++; continue; }
    const fields = parseLine();
    if (fields.length === 0 || (fields.length === 1 && fields[0] === '')) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      const val = fields[idx] ?? '';
      obj[h] = val === '' ? null : val;
    });
    rows.push(obj);
  }
  return rows;
}

// ─── SQL builders ─────────────────────────────────────────────────────────────

function buildProducts(rows, imageMap) {
  const lines = [];
  for (const r of rows) {
    const category = ['caftans','sacs','accessoires'].includes(r.category) ? r.category : 'caftans';
    // Validate on_sale constraint: on_sale=true requires original_price > price
    let onSale = escBool(r.on_sale);
    const price = parseFloat(r.price) || 0;
    const origPrice = r.original_price ? parseFloat(r.original_price) : null;
    if (onSale === 'TRUE' && (!origPrice || origPrice <= price)) onSale = 'FALSE';

    lines.push(`INSERT INTO products(id,name_fr,name_ar,description_fr,description_ar,price,original_price,on_sale,category,subcategory,tissu,stock_count,in_stock,is_visible,featured,is_new,created_at,updated_at) VALUES (` +
      `${esc(r.id)},` +
      `${esc(r.name_fr)},` +
      `${esc(r.name_ar)},` +
      `${esc(r.description_fr)},` +
      `${esc(r.description_ar)},` +
      `${escNum(r.price)},` +
      `${escNum(r.original_price)},` +
      `${onSale},` +
      `${esc(category)},` +
      `${esc(r.subcategory)},` +
      `${esc(r.tissu)},` +
      `${escInt(r.stock_count) || 10},` +
      `${escBool(r.in_stock) === 'NULL' ? 'TRUE' : escBool(r.in_stock)},` +
      `${escBool(r.is_visible) === 'NULL' ? 'TRUE' : escBool(r.is_visible)},` +
      `${escBool(r.featured) === 'NULL' ? 'FALSE' : escBool(r.featured)},` +
      `${escBool(r.is_new) === 'NULL' ? 'FALSE' : escBool(r.is_new)},` +
      `${esc(r.created_at)},${esc(r.updated_at)}` +
    `) ON CONFLICT (id) DO NOTHING;`);
  }
  return lines;
}

function buildProductImages(rows) {
  const lines = [];
  // Track primary images per product to avoid unique constraint violation
  const primarySeen = new Set();
  // Sort so is_primary=true comes first
  const sorted = [...rows].sort((a, b) => {
    const ap = String(a.is_primary).toLowerCase() === 'true' ? 0 : 1;
    const bp = String(b.is_primary).toLowerCase() === 'true' ? 0 : 1;
    return ap - bp;
  });
  for (const r of sorted) {
    const localUrl = rewriteUrl(r.image_url);
    let isPrimary = String(r.is_primary).toLowerCase() === 'true';
    if (isPrimary) {
      if (primarySeen.has(r.product_id)) { isPrimary = false; }
      else { primarySeen.add(r.product_id); }
    }
    lines.push(`INSERT INTO product_images(id,product_id,image_url,is_primary,display_order) VALUES (` +
      `${esc(r.id)},${esc(r.product_id)},${esc(localUrl)},${isPrimary ? 'TRUE' : 'FALSE'},${escInt(r.display_order) || 0}` +
    `) ON CONFLICT (id) DO NOTHING;`);
  }
  return lines;
}

function buildProductAttributes(rows) {
  return rows.map(r =>
    `INSERT INTO product_attributes(id,product_id,type,value) VALUES (` +
    `${esc(r.id)},${esc(r.product_id)},${esc(r.type)},${esc(r.value)}` +
    `) ON CONFLICT (id) DO NOTHING;`
  );
}

function buildPacks(rows) {
  return rows.map(r => {
    const localUrl = rewriteUrl(r.image_url);
    return `INSERT INTO packs(id,name_fr,name_ar,description_fr,description_ar,price,original_price,image_url,is_active,is_sold_out,savings,created_at) VALUES (` +
      `${esc(r.id)},${esc(r.name_fr)},${esc(r.name_ar)},${esc(r.description_fr)},${esc(r.description_ar)},` +
      `${escNum(r.price)},${escNum(r.original_price)},${esc(localUrl)},` +
      `${escBool(r.is_active) === 'NULL' ? 'TRUE' : escBool(r.is_active)},` +
      `${escBool(r.is_sold_out) === 'NULL' ? 'FALSE' : escBool(r.is_sold_out)},` +
      `${escNum(r.savings)},${esc(r.created_at)}` +
    `) ON CONFLICT (id) DO NOTHING;`;
  });
}

function buildPackItems(rows) {
  return rows.map(r =>
    `INSERT INTO pack_items(pack_id,product_id,quantity) VALUES (` +
    `${esc(r.pack_id)},${esc(r.product_id)},${escInt(r.quantity) || 1}` +
    `) ON CONFLICT (pack_id, product_id) DO NOTHING;`
  );
}

function buildOrders(rows) {
  const lines = [];
  for (const r of rows) {
    const phone = r.customer_phone || r.phone || 'N/A';
    const wilaya = r.wilaya || r.delivery_wilaya || 'N/A';
    const commune = r.delivery_commune || r.city || r.commune || wilaya;
    const delivType = ['home','stopdesk'].includes(r.delivery_type) ? r.delivery_type : 'home';
    const status = ['pending','confirmed','shipped','delivered','cancelled'].includes(r.status) ? r.status : 'pending';
    lines.push(
      `INSERT INTO orders(id,order_number,customer_name,phone,wilaya,commune,address,shipping_address,notes,total_price,delivery_fee,delivery_type,status,guepex_tracking,guepex_tracking_id,guepex_status,created_at,updated_at) VALUES (` +
      `${esc(r.id)},${esc(r.order_number)},${esc(r.customer_name)},${esc(phone)},${esc(wilaya)},${esc(commune)},` +
      `${esc(r.address || r.shipping_address)},${esc(r.shipping_address)},${esc(r.notes)},` +
      `${escNum(r.total_price)},${escNum(r.delivery_fee) || 0},${esc(delivType)},${esc(status)},` +
      `${esc(r.guepex_tracking)},${esc(r.guepex_tracking_id)},${esc(r.guepex_status)},` +
      `${esc(r.created_at)},${esc(r.updated_at || r.created_at)}` +
      `) ON CONFLICT (id) DO NOTHING;`
    );
  }
  return lines;
}

function buildOrderItems(rows) {
  return rows.map(r => {
    const localImg = rewriteUrl(r.product_image);
    const packId = r.pack_id && r.pack_id !== '' ? esc(r.pack_id) : 'NULL';
    const prodId = r.product_id && r.product_id !== '' ? esc(r.product_id) : 'NULL';
    return `INSERT INTO order_items(id,order_id,product_id,pack_id,product_name,product_image,quantity,size,color,price_at_purchase) VALUES (` +
      `${esc(r.id)},${esc(r.order_id)},${prodId},${packId},${esc(r.product_name)},${esc(localImg)},` +
      `${escInt(r.quantity) || 1},${esc(r.size)},${esc(r.color)},${escNum(r.price_at_purchase)}` +
    `) ON CONFLICT (id) DO NOTHING;`;
  });
}

function buildMessages(rows) {
  return rows.map(r => {
    const fullName = r.sender_name || r.name || r.full_name || 'Inconnu';
    const email    = r.sender_email || r.email || null;
    const phone    = r.sender_phone || r.phone || null;
    const message  = r.body || r.message || r.subject || '(no content)';
    const isRead   = String(r.is_read).toLowerCase() === 'true';
    let status = r.status;
    if (!['unread','read','replied'].includes(status)) {
      status = isRead ? 'read' : 'unread';
    }
    return `INSERT INTO messages(id,full_name,email,phone,subject,message,status,created_at) VALUES (` +
      `${esc(r.id)},${esc(fullName)},${esc(email)},${esc(phone)},${esc(r.subject)},${esc(message)},${esc(status)},${esc(r.created_at)}` +
    `) ON CONFLICT (id) DO NOTHING;`;
  });
}

function buildShippingRates(rows) {
  return rows.map(r =>
    `INSERT INTO shipping_rates(wilaya,zone,tarif_domicile,tarif_stopdesk,tarif_retour,created_at) VALUES (` +
    `${esc(r.wilaya)},${escInt(r.zone) || 0},${escNum(r.tarif_domicile) || 0},${escNum(r.tarif_stopdesk) || 0},${escNum(r.tarif_retour) || 0},${esc(r.created_at)}` +
    `) ON CONFLICT (wilaya) DO NOTHING;`
  );
}

function buildPromos(rows) {
  return rows.map(r => {
    let type = r.type || r.discount_type;
    if (type === 'percent' || type === 'percentage') type = 'percentage';
    else if (type === 'fixed' || type === 'amount') type = 'fixed';
    else type = 'percentage';
    return `INSERT INTO promo_codes(id,code,type,value,min_order,max_uses,used_count,is_active,expires_at,created_at) VALUES (` +
      `${esc(r.id)},${esc(r.code)},${esc(type)},${escNum(r.value || r.discount_value)},` +
      `${escNum(r.min_order) || 0},${escInt(r.max_uses)},${escInt(r.used_count) || 0},` +
      `${escBool(r.is_active) === 'NULL' ? 'TRUE' : escBool(r.is_active)},` +
      `${esc(r.expires_at)},${esc(r.created_at)}` +
    `) ON CONFLICT (id) DO NOTHING;`;
  });
}

function buildReviews(rows) {
  return rows.map(r => {
    const productId = r.product_id || r.product;
    if (!productId) return null;
    const status = ['pending','approved','rejected'].includes(r.status) ? r.status : 'approved';
    return `INSERT INTO reviews(id,product_id,author_name,rating,content,status,created_at) VALUES (` +
      `${esc(r.id)},${esc(productId)},${esc(r.author_name || r.name || 'Client')},` +
      `${escInt(r.rating) || 5},${esc(r.content || r.body || r.comment)},${esc(status)},${esc(r.created_at)}` +
    `) ON CONFLICT (id) DO NOTHING;`;
  }).filter(Boolean);
}

function buildHeroBanners(rows) {
  return rows.map(r => {
    const localUrl = rewriteUrl(r.image_url);
    return `INSERT INTO hero_banners(id,title_part1,title_accent,title_part2,subtitle,cta_text,image_url,is_active,sort_order,created_at) VALUES (` +
      `${esc(r.id)},${esc(r.title_part1)},${esc(r.title_accent)},${esc(r.title_part2)},` +
      `${esc(r.subtitle)},${esc(r.cta_text)},${esc(localUrl)},` +
      `${escBool(r.is_active) === 'NULL' ? 'TRUE' : escBool(r.is_active)},` +
      `${escInt(r.sort_order) || 0},${esc(r.created_at)}` +
    `) ON CONFLICT (id) DO NOTHING;`;
  });
}

function buildSiteSettings(rows) {
  return rows.map(r => {
    const val = typeof r.value === 'object' ? JSON.stringify(r.value) : r.value;
    const safeVal = val ? val.replace(/'/g, "''") : null;
    return `INSERT INTO site_settings(key,value,created_at,updated_at) VALUES (` +
      `${esc(r.key)},${safeVal ? `'${safeVal}'::jsonb` : 'NULL'},` +
      `${esc(r.created_at)},${esc(r.updated_at || r.created_at)}` +
    `) ON CONFLICT (key) DO NOTHING;`;
  });
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('Starting export...\n');

  // Ensure upload dirs exist
  ['products', 'packs', 'hero'].forEach(d => {
    fs.mkdirSync(path.join(UPLOADS_DIR, d), { recursive: true });
  });

  // ── 1. Read CSV data ──────────────────────────────────────────────────────
  log('Parsing CSV files...');
  const products       = parseCsv(path.join(DATA_DIR, 'products_rows.csv'));
  const productImages  = parseCsv(path.join(DATA_DIR, 'product_images_rows.csv'));
  const productAttribs = parseCsv(path.join(DATA_DIR, 'product_attributes_rows.csv'));
  const packs          = parseCsv(path.join(DATA_DIR, 'packs_rows.csv'));
  const packItems      = parseCsv(path.join(DATA_DIR, 'pack_items_rows.csv'));
  const orders         = parseCsv(path.join(DATA_DIR, 'orders_rows.csv'));
  const orderItems     = parseCsv(path.join(DATA_DIR, 'order_items_rows.csv'));
  const messages       = parseCsv(path.join(DATA_DIR, 'messages_rows.csv'));
  const shippingRates  = parseCsv(path.join(DATA_DIR, 'shipping_rates_rows.csv'));

  log(`  products: ${products.length}, images: ${productImages.length}, attrs: ${productAttribs.length}`);
  log(`  packs: ${packs.length}, pack_items: ${packItems.length}`);
  log(`  orders: ${orders.length}, order_items: ${orderItems.length}`);
  log(`  messages: ${messages.length}, shipping_rates: ${shippingRates.length}`);

  // ── 2. Fetch missing tables from Supabase REST API ────────────────────────
  log('\nFetching additional tables from Supabase REST API...');
  let promos = [], reviews = [], heroBanners = [], siteSettings = [], shipments = [];

  try { promos = await fetchSupabaseTable('promo_codes'); log(`  promo_codes: ${promos.length}`); }
  catch (e) { warn(`promo_codes fetch failed: ${e.message}`); }

  try { reviews = await fetchSupabaseTable('reviews'); log(`  reviews: ${reviews.length}`); }
  catch (e) { warn(`reviews fetch failed: ${e.message}`); }

  try { heroBanners = await fetchSupabaseTable('hero_banners'); log(`  hero_banners: ${heroBanners.length}`); }
  catch (e) { warn(`hero_banners fetch failed: ${e.message}`); }

  try { siteSettings = await fetchSupabaseTable('site_settings'); log(`  site_settings: ${siteSettings.length}`); }
  catch (e) { warn(`site_settings fetch failed: ${e.message}`); }

  try { shipments = await fetchSupabaseTable('shipments'); log(`  shipments: ${shipments.length}`); }
  catch (e) { warn(`shipments fetch failed: ${e.message}`); }

  // ── 3. Collect all image URLs ─────────────────────────────────────────────
  log('\nCollecting image URLs...');
  const imageJobs = []; // { url, dest }

  const addImage = (url, folder) => {
    if (!url || !url.includes('supabase.co')) return;
    const relPath = storageRelPath(url);
    if (!relPath) return;
    const dest = path.join(UPLOADS_DIR, relPath);
    imageJobs.push({ url, dest, relPath });
  };

  productImages.forEach(r => addImage(r.image_url, 'products'));
  orderItems.forEach(r => addImage(r.product_image, 'products'));
  packs.forEach(r => addImage(r.image_url, 'packs'));
  heroBanners.forEach(r => addImage(r.image_url, 'hero'));

  // Deduplicate
  const seen = new Set();
  const uniqueJobs = imageJobs.filter(j => {
    if (seen.has(j.dest)) return false;
    seen.add(j.dest);
    return true;
  });

  log(`  ${uniqueJobs.length} unique images to download`);

  // ── 4. Download images ────────────────────────────────────────────────────
  log('\nDownloading images...');
  let downloaded = 0, skipped = 0, failed = 0;
  const CONCURRENCY = 8;
  for (let i = 0; i < uniqueJobs.length; i += CONCURRENCY) {
    const batch = uniqueJobs.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async ({ url, dest }) => {
      try {
        const isNew = await downloadFile(url, dest);
        if (isNew) { downloaded++; }
        else { skipped++; }
      } catch (e) {
        failed++;
        warn(`Failed: ${url} → ${e.message}`);
      }
    }));
    process.stdout.write(`\r  Progress: ${Math.min(i + CONCURRENCY, uniqueJobs.length)}/${uniqueJobs.length}`);
  }
  log(`\n  Downloaded: ${downloaded}, Already existed: ${skipped}, Failed: ${failed}`);

  // ── 5. Build SQL ──────────────────────────────────────────────────────────
  log('\nGenerating SQL...');

  const sections = [];

  const section = (title, lines) => {
    if (lines.length === 0) return;
    sections.push(`\n-- ──────────────────────────────────────────\n-- ${title}\n-- ──────────────────────────────────────────\n`);
    sections.push(...lines);
  };

  section('PRODUCTS',            buildProducts(products));
  section('PRODUCT IMAGES',      buildProductImages(productImages));
  section('PRODUCT ATTRIBUTES',  buildProductAttributes(productAttribs));
  section('PACKS',               buildPacks(packs));
  section('PACK ITEMS',          buildPackItems(packItems));
  section('PROMO CODES',         buildPromos(promos));
  section('ORDERS',              buildOrders(orders));
  section('ORDER ITEMS',         buildOrderItems(orderItems));
  section('MESSAGES',            buildMessages(messages));
  section('REVIEWS',             buildReviews(reviews));
  section('HERO BANNERS',        buildHeroBanners(heroBanners));
  section('SHIPPING RATES',      buildShippingRates(shippingRates));

  // Site settings: ship sane defaults if none from Supabase
  if (siteSettings.length > 0) {
    section('SITE SETTINGS', buildSiteSettings(siteSettings));
  } else {
    section('SITE SETTINGS (defaults)', [
      `INSERT INTO site_settings(key,value) VALUES ('hero_content','{"title_part1":"Découvrez","title_accent":"Notre Collection","title_part2":"","subtitle":"Des caftans d''exception, faits pour vous","cta_text":"Voir la Collection"}'::jsonb) ON CONFLICT (key) DO NOTHING;`,
      `INSERT INTO site_settings(key,value) VALUES ('store_info','{"name":"Maison Caftan","phone":"+213 XX XX XX XX","email":"contact@maisoncaftan.dz","wilaya":"M''Sila","commune":"Berhoum"}'::jsonb) ON CONFLICT (key) DO NOTHING;`,
    ]);
  }

  const header = `-- ============================================================
--  CAFTAN DB SEED DATA
--  Auto-generated by export-from-supabase.js on ${new Date().toISOString()}
--  Run AFTER 001_schema.sql:
--    psql -U postgres -d caftan_db -f backend/migrations/002_seed_data.sql
-- ============================================================

SET client_encoding = 'UTF8';

`;

  const sql = header + sections.join('\n') + '\n';
  fs.writeFileSync(OUT_SQL, sql, 'utf8');

  log(`\nSQL written to: ${path.relative(ROOT, OUT_SQL)}`);
  const lineCount = sql.split('\n').length;
  log(`Total: ${lineCount} lines\n`);
  log('Done! Next steps:');
  log('  1. Run migration: psql -U postgres -d caftan_db -f backend/migrations/001_schema.sql');
  log('  2. Seed data:     psql -U postgres -d caftan_db -f backend/migrations/002_seed_data.sql');
  log('  3. Create admin:  cd backend && node scripts/seed-admin.js');
}

main().catch(e => {
  process.stderr.write(`\nFATAL: ${e.message}\n${e.stack}\n`);
  process.exit(1);
});
