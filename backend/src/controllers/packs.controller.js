'use strict';

const { query, transaction } = require('../config/database');
const { processImage, deleteImageFile } = require('../middleware/upload');
const { delPattern } = require('../config/redis');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildUrl } = require('../utils/buildUrl');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validateUUID = (id) => {
  if (!id || !UUID_RE.test(id)) throw ApiError.badRequest('Invalid pack ID format');
};

const hydratePackItems = async (packIds) => {
  if (!packIds.length) return {};
  const res = await query(
    `SELECT pi.id, pi.pack_id, pi.product_id, pi.quantity,
            p.name_fr, p.name_ar, p.price,
            (SELECT image_url FROM product_images
             WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS primary_image
     FROM pack_items pi
     JOIN products p ON p.id = pi.product_id
     WHERE pi.pack_id = ANY($1)
     ORDER BY pi.pack_id, pi.id`,
    [packIds]
  );
  const map = {};
  for (const row of res.rows) {
    if (!map[row.pack_id]) map[row.pack_id] = [];
    map[row.pack_id].push({ ...row, primary_image: buildUrl(row.primary_image) });
  }
  return map;
};

const getPacks = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM packs WHERE is_active = TRUE ORDER BY created_at DESC'
  );
  const ids = result.rows.map((r) => r.id);
  const itemsMap = await hydratePackItems(ids);
  res.json({
    success: true,
    data: result.rows.map((p) => ({
      ...p,
      image_url: buildUrl(p.image_url),
      items: itemsMap[p.id] ?? [],
    })),
  });
});

const getPack = asyncHandler(async (req, res) => {
  validateUUID(req.params.id);
  const result = await query('SELECT * FROM packs WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) throw ApiError.notFound('Pack not found');
  const pack = result.rows[0];
  const itemsMap = await hydratePackItems([pack.id]);
  res.json({
    success: true,
    data: { ...pack, image_url: buildUrl(pack.image_url), items: itemsMap[pack.id] ?? [] },
  });
});

const getAdminPacks = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM packs ORDER BY created_at DESC');
  const ids = result.rows.map((r) => r.id);
  const itemsMap = await hydratePackItems(ids);
  res.json({
    success: true,
    data: result.rows.map((p) => ({
      ...p,
      image_url: buildUrl(p.image_url),
      items: itemsMap[p.id] ?? [],
    })),
  });
});

const createPack = asyncHandler(async (req, res) => {
  const {
    name_fr, name_ar, description_fr, description_ar,
    price, original_price, is_active, is_sold_out, savings,
    items = '[]',
  } = req.body;
  if (!name_fr || !price) throw ApiError.badRequest('name_fr and price are required');

  let imageUrl = null;
  if (req.file) imageUrl = await processImage(req.file.buffer, 'packs');

  const pack = await transaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO packs
         (name_fr, name_ar, description_fr, description_ar, price, original_price,
          image_url, is_active, is_sold_out, savings)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        name_fr, name_ar ?? null, description_fr ?? null, description_ar ?? null,
        parseFloat(price), original_price ? parseFloat(original_price) : null,
        imageUrl,
        is_active !== 'false' && is_active !== false,
        is_sold_out === 'true' || is_sold_out === true,
        savings ? parseFloat(savings) : null,
      ]
    );
    const p = ins.rows[0];
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    if (Array.isArray(parsedItems) && parsedItems.length > 0) {
      const itemValues = [];
      const itemPlaceholders = [];
      let idx = 1;
      for (const item of parsedItems) {
        itemPlaceholders.push(`($${idx++}, $${idx++}, $${idx++})`);
        itemValues.push(p.id, item.product_id, item.quantity ?? 1);
      }
      await client.query(
        `INSERT INTO pack_items (pack_id, product_id, quantity)
         VALUES ${itemPlaceholders.join(', ')}`,
        itemValues
      );
    }
    return p;
  });

  await delPattern('cache:/api/packs*');
  res.status(201).json({ success: true, data: pack });
});

const updatePack = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateUUID(id);
  const existing = await query('SELECT id, image_url FROM packs WHERE id = $1', [id]);
  if (!existing.rows[0]) throw ApiError.notFound('Pack not found');

  const {
    name_fr, name_ar, description_fr, description_ar,
    price, original_price, is_active, is_sold_out, savings,
    items,
  } = req.body;

  let newImageUrl = existing.rows[0].image_url;
  if (req.file) {
    await deleteImageFile(existing.rows[0].image_url);
    newImageUrl = await processImage(req.file.buffer, 'packs');
  }

  await transaction(async (client) => {
    const fields = ['image_url = $1'];
    const vals = [newImageUrl];
    let pi = 2;

    const set = (col, val) => { fields.push(`${col} = $${pi++}`); vals.push(val); };
    if (name_fr !== undefined) set('name_fr', name_fr);
    if (name_ar !== undefined) set('name_ar', name_ar);
    if (description_fr !== undefined) set('description_fr', description_fr);
    if (description_ar !== undefined) set('description_ar', description_ar);
    if (price !== undefined) set('price', parseFloat(price));
    if (original_price !== undefined) set('original_price', original_price ? parseFloat(original_price) : null);
    if (is_active !== undefined) set('is_active', is_active !== 'false' && is_active !== false);
    if (is_sold_out !== undefined) set('is_sold_out', is_sold_out === 'true' || is_sold_out === true);
    if (savings !== undefined) set('savings', savings ? parseFloat(savings) : null);

    vals.push(id);
    await client.query(`UPDATE packs SET ${fields.join(', ')} WHERE id = $${pi}`, vals);

    if (items !== undefined) {
      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      await client.query('DELETE FROM pack_items WHERE pack_id = $1', [id]);
      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        const itemValues = [];
        const itemPlaceholders = [];
        let idx = 1;
        for (const item of parsedItems) {
          itemPlaceholders.push(`($${idx++}, $${idx++}, $${idx++})`);
          itemValues.push(id, item.product_id, item.quantity ?? 1);
        }
        await client.query(
          `INSERT INTO pack_items (pack_id, product_id, quantity)
           VALUES ${itemPlaceholders.join(', ')}`,
          itemValues
        );
      }
    }
  });

  await delPattern('cache:/api/packs*');
  const updated = await query('SELECT * FROM packs WHERE id = $1', [id]);
  res.json({ success: true, data: updated.rows[0] });
});

const deletePack = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateUUID(id);
  const result = await query('SELECT image_url FROM packs WHERE id = $1', [id]);
  if (!result.rows[0]) throw ApiError.notFound('Pack not found');

  try {
    await query('DELETE FROM packs WHERE id = $1', [id]);
  } catch (err) {
    // Foreign key violation: pack is referenced by existing orders
    if (err.code === '23503') {
      throw ApiError.badRequest('Ce pack ne peut pas être supprimé car il est référencé par des commandes existantes.');
    }
    throw err;
  }

  await deleteImageFile(result.rows[0].image_url);
  await delPattern('cache:/api/packs*');
  res.json({ success: true, message: 'Pack deleted' });
});

module.exports = { getPacks, getPack, getAdminPacks, createPack, updatePack, deletePack };
