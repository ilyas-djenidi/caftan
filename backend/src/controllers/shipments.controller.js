'use strict';

const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const upsertShipment = asyncHandler(async (req, res) => {
  const { tracking, order_id, order_number, status, wilaya, ville,
          destinataire_nom, destinataire_phone, date_expedition } = req.body;
  if (!tracking) throw ApiError.badRequest('tracking is required');

  const result = await query(
    `INSERT INTO shipments
       (tracking, order_id, order_number, status, wilaya, ville,
        destinataire_nom, destinataire_phone, date_expedition)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (tracking) DO UPDATE SET
       status = EXCLUDED.status,
       wilaya = COALESCE(EXCLUDED.wilaya, shipments.wilaya),
       ville  = COALESCE(EXCLUDED.ville,  shipments.ville)
     RETURNING *`,
    [tracking, order_id ?? null, order_number ?? null, status ?? null,
     wilaya ?? null, ville ?? null, destinataire_nom ?? null,
     destinataire_phone ?? null, date_expedition ?? null]
  );

  // Also update guepex_status on the linked order
  if (status && order_id) {
    await query(
      'UPDATE orders SET guepex_status = $1, updated_at = NOW() WHERE id = $2',
      [status, order_id]
    );
  }

  res.json({ success: true, data: result.rows[0] });
});

const getShipments = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM shipments ORDER BY created_at DESC LIMIT 500'
  );
  res.json({ success: true, data: result.rows });
});

const getShipment = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM shipments WHERE tracking = $1',
    [req.params.tracking]
  );
  if (!result.rows[0]) throw ApiError.notFound('Shipment not found');
  res.json({ success: true, data: result.rows[0] });
});

const updateShipmentStatus = asyncHandler(async (req, res) => {
  const { status, orderNumber } = req.body;
  if (!status) throw ApiError.badRequest('status is required');

  const result = await query(
    'UPDATE shipments SET status = $1 WHERE tracking = $2 RETURNING *',
    [status, req.params.tracking]
  );

  let orderResult;
  if (orderNumber) {
    orderResult = await query(
      `UPDATE orders 
       SET guepex_status = $1, 
           status = CASE WHEN $1 IN ('Annulé', 'cancelled', 'returned') THEN 'cancelled' ELSE status END, 
           updated_at = NOW() 
       WHERE regexp_replace(order_number, '[^a-zA-Z0-9]', '', 'g') = $2 
          OR guepex_tracking = $3 
          OR guepex_tracking_id = $3
       RETURNING *`,
      [status, orderNumber, req.params.tracking]
    );
  } else {
    orderResult = await query(
      `UPDATE orders 
       SET guepex_status = $1, 
           status = CASE WHEN $1 IN ('Annulé', 'cancelled', 'returned') THEN 'cancelled' ELSE status END, 
           updated_at = NOW() 
       WHERE guepex_tracking = $2 OR guepex_tracking_id = $2 
       RETURNING *`,
      [status, req.params.tracking]
    );
  }

  // Sync back to shipments if order existed but shipment record was missing
  if (!result.rows[0] && orderResult.rows[0]) {
    const orderObj = orderResult.rows[0];
    await query(
      `INSERT INTO shipments 
         (tracking, order_id, order_number, status, wilaya, ville, destinataire_nom, destinataire_phone, date_expedition)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (tracking) DO NOTHING`,
      [
        req.params.tracking,
        orderObj.id,
        orderObj.order_number,
        status,
        orderObj.wilaya,
        orderObj.commune,
        `${orderObj.first_name || ''} ${orderObj.last_name || ''}`.trim(),
        orderObj.phone
      ]
    );
  } else if (result.rows[0] && result.rows[0].order_id && !orderResult.rows[0]) {
    // Sync to order if shipment existed but order update wasn't triggered
    await query(
      `UPDATE orders 
       SET guepex_status = $1, 
           status = CASE WHEN $1 IN ('Annulé', 'cancelled', 'returned') THEN 'cancelled' ELSE status END, 
           updated_at = NOW() 
       WHERE id = $2`,
      [status, result.rows[0].order_id]
    );
  }

  if (!result.rows[0] && !orderResult.rows[0]) {
    throw ApiError.notFound('Shipment or Order not found');
  }

  res.json({ success: true, data: result.rows[0] || orderResult.rows[0] });
});

module.exports = { upsertShipment, getShipments, getShipment, updateShipmentStatus };
