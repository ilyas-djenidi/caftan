'use strict';

const { query, transaction } = require('../config/database');
const { processImage, deleteImageFile } = require('../middleware/upload');
const { delPattern, del } = require('../config/redis');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildUrl } = require('../utils/buildUrl');

// ── Helpers ──────────────────────────────────────────────────

const attachImages = async (productIds) => {
  if (!productIds.length) return {};
  const result = await query(
    `SELECT id, product_id, image_url, is_primary, display_order
     FROM product_images
     WHERE product_id = ANY($1)
     ORDER BY is_primary DESC, display_order ASC`,
    [productIds]
  );
  const map = {};
  for (const row of result.rows) {
    if (!map[row.product_id]) map[row.product_id] = [];
    map[row.product_id].push({ ...row, image_url: buildUrl(row.image_url) });
  }
  return map;
};

const attachAttributes = async (productIds) => {
  if (!productIds.length) return {};
  const result = await query(
    'SELECT id, product_id, type, value FROM product_attributes WHERE product_id = ANY($1)',
    [productIds]
  );
  const map = {};
  for (const row of result.rows) {
    if (!map[row.product_id]) map[row.product_id] = [];
    map[row.product_id].push(row);
  }
  return map;
};

// ── List (public) ─────────────────────────────────────────────

const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    featured,
    on_sale,
    search,
    sort = 'created_at_desc',
    page = 1,
    limit = 12,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ['p.is_visible = TRUE'];
  const params = [];
  let pi = 1;

  if (category) { conditions.push(`p.category = $${pi++}`); params.push(category); }
  if (featured === 'true') { conditions.push('p.featured = TRUE'); }
  if (on_sale === 'true') { conditions.push('p.on_sale = TRUE'); }
  if (search) {
    conditions.push(
      `(p.name_fr ILIKE $${pi} OR p.name_ar ILIKE $${pi} OR p.description_fr ILIKE $${pi})`
    );
    params.push(`%${search}%`);
    pi++;
  }

  const ORDER_MAP = {
    created_at_desc: 'p.created_at DESC',
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    name_asc: 'p.name_fr ASC',
  };
  const orderClause = ORDER_MAP[sort] ?? 'p.created_at DESC';
  const whereClause = conditions.join(' AND ');

  const countResult = await query(
    `SELECT COUNT(*) FROM products p WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limitNum, offset);
  const dataResult = await query(
    `SELECT p.id, p.name_fr, p.name_ar, p.price, p.original_price, p.on_sale,
            p.category, p.subcategory, p.stock_count, p.in_stock, p.featured,
            p.is_new, p.created_at
     FROM products p
     WHERE ${whereClause}
     ORDER BY ${orderClause}
     LIMIT $${pi} OFFSET $${pi + 1}`,
    params
  );

  const ids = dataResult.rows.map((r) => r.id);
  const imagesMap = await attachImages(ids);

  const products = dataResult.rows.map((p) => ({
    ...p,
    images: imagesMap[p.id] ?? [],
  }));

  res.json({
    success: true,
    data: products,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// ── Single (public) ───────────────────────────────────────────

const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('SELECT * FROM products WHERE id = $1 AND is_visible = TRUE', [id]);
  if (!result.rows[0]) throw ApiError.notFound('Product not found');

  const product = result.rows[0];
  const [imagesMap, attrsMap] = await Promise.all([
    attachImages([id]),
    attachAttributes([id]),
  ]);

  res.json({
    success: true,
    data: {
      ...product,
      images: imagesMap[id] ?? [],
      attributes: attrsMap[id] ?? [],
    },
  });
});

// ── Single (admin) ────────────────────────────────────────────

const getProductAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('SELECT * FROM products WHERE id = $1', [id]);
  if (!result.rows[0]) throw ApiError.notFound('Product not found');

  const product = result.rows[0];
  const [imagesMap, attrsMap] = await Promise.all([
    attachImages([id]),
    attachAttributes([id]),
  ]);

  res.json({
    success: true,
    data: {
      ...product,
      images: imagesMap[id] ?? [],
      attributes: attrsMap[id] ?? [],
    },
  });
});

// ── Create (admin) ────────────────────────────────────────────

const createProduct = asyncHandler(async (req, res) => {
  const {
    name_fr, name_ar, description_fr, description_ar,
    price, original_price, on_sale, category, subcategory, tissu,
    stock_count, is_visible, featured, is_new,
    attributes = [],
  } = req.body;

  if (!name_fr || !price || !category) {
    throw ApiError.badRequest('name_fr, price, and category are required');
  }

  const files = req.files ?? [];
  const uploadedUrls = [];

  try {
    // 1. Process and upload images in parallel outside the DB transaction
    if (files.length > 0) {
      const uploadPromises = files.map((file) => processImage(file.buffer, 'products'));
      const urls = await Promise.all(uploadPromises);
      uploadedUrls.push(...urls);
    }

    const product = await transaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO products
           (name_fr, name_ar, description_fr, description_ar, price, original_price,
            on_sale, category, subcategory, tissu, stock_count, is_visible, featured, is_new)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          name_fr, name_ar ?? null, description_fr ?? null, description_ar ?? null,
          parseFloat(price), original_price ? parseFloat(original_price) : null,
          on_sale === 'true' || on_sale === true,
          category, subcategory ?? null, tissu ?? null,
          parseInt(stock_count ?? 0, 10),
          is_visible !== 'false' && is_visible !== false,
          featured === 'true' || featured === true,
          is_new === 'true' || is_new === true,
        ]
      );
      const prod = ins.rows[0];

      // 2. Batch insert images
      if (uploadedUrls.length > 0) {
        const imgValues = [];
        const imgPlaceholders = [];
        let idx = 1;
        for (let i = 0; i < uploadedUrls.length; i++) {
          imgPlaceholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++})`);
          imgValues.push(prod.id, uploadedUrls[i], i === 0, i);
        }
        await client.query(
          `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
           VALUES ${imgPlaceholders.join(', ')}`,
          imgValues
        );
      }

      // 3. Batch insert attributes
      const attrs = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
      if (Array.isArray(attrs) && attrs.length > 0) {
        const attrValues = [];
        const attrPlaceholders = [];
        let idx = 1;
        for (const attr of attrs) {
          attrPlaceholders.push(`($${idx++}, $${idx++}, $${idx++})`);
          attrValues.push(prod.id, attr.type, attr.value);
        }
        await client.query(
          `INSERT INTO product_attributes (product_id, type, value)
           VALUES ${attrPlaceholders.join(', ')}`,
          attrValues
        );
      }

      return prod;
    });

    await Promise.all([
      delPattern('cache:/api/products*'),
      del('cache:/api/home'),
    ]);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    // Clean up newly uploaded files from Cloudinary on error/rollback
    if (uploadedUrls.length > 0) {
      await Promise.all(uploadedUrls.map((url) => deleteImageFile(url))).catch((cleanupErr) => {
        console.error('Error cleaning up uploaded images:', cleanupErr.message);
      });
    }
    throw err;
  }
});

// ── Update (admin) ────────────────────────────────────────────

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await query('SELECT id FROM products WHERE id = $1', [id]);
  if (!existing.rows[0]) throw ApiError.notFound('Product not found');

  const {
    name_fr, name_ar, description_fr, description_ar,
    price, original_price, on_sale, category, subcategory, tissu,
    stock_count, is_visible, featured, is_new,
    attributes,
    images_to_delete = '[]',
  } = req.body;

  const toDelete = typeof images_to_delete === 'string'
    ? JSON.parse(images_to_delete) : images_to_delete;

  // We will collect the Cloudinary URLs that need to be deleted
  const cloudinaryUrlsToDelete = [];
  if (toDelete.length > 0) {
    const imgRes = await query(
      'SELECT image_url FROM product_images WHERE id = ANY($1) AND product_id = $2',
      [toDelete, id]
    );
    cloudinaryUrlsToDelete.push(...imgRes.rows.map((r) => r.image_url));
  }

  // Upload new images in parallel BEFORE starting the transaction
  const files = req.files ?? [];
  const uploadedUrls = [];

  try {
    if (files.length > 0) {
      const uploadPromises = files.map((file) => processImage(file.buffer, 'products'));
      const urls = await Promise.all(uploadPromises);
      uploadedUrls.push(...urls);
    }

    await transaction(async (client) => {
      const fields = [];
      const vals = [];
      let pi = 1;

      const set = (col, val) => { fields.push(`${col} = $${pi++}`); vals.push(val); };

      if (name_fr !== undefined) set('name_fr', name_fr);
      if (name_ar !== undefined) set('name_ar', name_ar);
      if (description_fr !== undefined) set('description_fr', description_fr);
      if (description_ar !== undefined) set('description_ar', description_ar);
      if (price !== undefined) set('price', parseFloat(price));
      if (original_price !== undefined) set('original_price', original_price ? parseFloat(original_price) : null);
      if (on_sale !== undefined) set('on_sale', on_sale === 'true' || on_sale === true);
      if (category !== undefined) set('category', category);
      if (subcategory !== undefined) set('subcategory', subcategory);
      if (tissu !== undefined) set('tissu', tissu);
      if (stock_count !== undefined) set('stock_count', parseInt(stock_count, 10));
      if (is_visible !== undefined) set('is_visible', is_visible !== 'false' && is_visible !== false);
      if (featured !== undefined) set('featured', featured === 'true' || featured === true);
      if (is_new !== undefined) set('is_new', is_new === 'true' || is_new === true);

      if (fields.length > 0) {
        vals.push(id);
        await client.query(
          `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${pi}`,
          vals
        );
      }

      // Delete specified images in database
      if (toDelete.length > 0) {
        await client.query(
          'DELETE FROM product_images WHERE id = ANY($1) AND product_id = $2',
          [toDelete, id]
        );
      }

      // Add new uploaded images
      if (uploadedUrls.length > 0) {
        const orderResult = await client.query(
          'SELECT COALESCE(MAX(display_order), -1) AS max_order FROM product_images WHERE product_id = $1',
          [id]
        );
        let nextOrder = orderResult.rows[0].max_order + 1;

        const imgValues = [];
        const imgPlaceholders = [];
        let idx = 1;
        for (const urlPath of uploadedUrls) {
          imgPlaceholders.push(`($${idx++}, $${idx++}, FALSE, $${idx++})`);
          imgValues.push(id, urlPath, nextOrder++);
        }
        await client.query(
          `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
           VALUES ${imgPlaceholders.join(', ')}`,
          imgValues
        );
      }

      // Update attributes if provided (batch delete and batch insert)
      if (attributes !== undefined) {
        const attrs = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
        await client.query('DELETE FROM product_attributes WHERE product_id = $1', [id]);
        if (Array.isArray(attrs) && attrs.length > 0) {
          const attrValues = [];
          const attrPlaceholders = [];
          let idx = 1;
          for (const attr of attrs) {
            attrPlaceholders.push(`($${idx++}, $${idx++}, $${idx++})`);
            attrValues.push(id, attr.type, attr.value);
          }
          await client.query(
            `INSERT INTO product_attributes (product_id, type, value)
             VALUES ${attrPlaceholders.join(', ')}`,
            attrValues
          );
        }
      }
    });

    // DB Transaction succeeded! Now we can safely delete old images from Cloudinary in background (non-blocking)
    if (cloudinaryUrlsToDelete.length > 0) {
      Promise.all(cloudinaryUrlsToDelete.map((url) => deleteImageFile(url))).catch((delErr) => {
        console.error('Error deleting replaced images from Cloudinary:', delErr.message);
      });
    }

    await Promise.all([
      delPattern('cache:/api/products*'),
      del(`cache:/api/products/${id}`),
      del('cache:/api/home'),
    ]);

    const updated = await query('SELECT * FROM products WHERE id = $1', [id]);
    res.json({ success: true, data: updated.rows[0] });

  } catch (err) {
    // If the database transaction fails/rolls back, clean up the newly uploaded files
    if (uploadedUrls.length > 0) {
      await Promise.all(uploadedUrls.map((url) => deleteImageFile(url))).catch((cleanupErr) => {
        console.error('Error cleaning up uploaded images:', cleanupErr.message);
      });
    }
    throw err;
  }
});

// ── Delete (admin) ────────────────────────────────────────────

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check it's not in any pack
  const packCheck = await query(
    'SELECT 1 FROM pack_items WHERE product_id = $1 LIMIT 1', [id]
  );
  if (packCheck.rows.length > 0) {
    throw ApiError.conflict('Cannot delete product that is part of a pack. Remove it from the pack first.');
  }

  const images = await query(
    'SELECT image_url FROM product_images WHERE product_id = $1', [id]
  );

  await query('DELETE FROM products WHERE id = $1', [id]);

  // Clean up image files after successful DB delete
  for (const row of images.rows) deleteImageFile(row.image_url);

  await Promise.all([
    delPattern('cache:/api/products*'),
    del('cache:/api/home'),
  ]);
  res.json({ success: true, message: 'Product deleted' });
});

// ── Admin list (includes hidden) ──────────────────────────────

const getAdminProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, category } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];
  let pi = 1;
  if (category) { conditions.push(`category = $${pi++}`); params.push(category); }
  if (search) {
    conditions.push(`(name_fr ILIKE $${pi} OR name_ar ILIKE $${pi})`);
    params.push(`%${search}%`); pi++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM products ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limitNum, offset);
  const dataRes = await query(
    `SELECT id, name_fr, name_ar, price, category, stock_count, in_stock,
            is_visible, featured, on_sale, created_at
     FROM products ${where}
     ORDER BY created_at DESC
     LIMIT $${pi} OFFSET $${pi + 1}`,
    params
  );

  const ids = dataRes.rows.map((r) => r.id);
  const imagesMap = await attachImages(ids);

  res.json({
    success: true,
    data: dataRes.rows.map((p) => ({ ...p, images: imagesMap[p.id] ?? [] })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getAdminProducts, getProductAdmin };
