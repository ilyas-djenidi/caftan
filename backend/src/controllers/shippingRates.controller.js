'use strict';

const { query } = require('../config/database');
const { del } = require('../config/redis');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getAllRates = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM shipping_rates ORDER BY wilaya ASC'
  );
  res.json({ success: true, data: result.rows });
});

const getRate = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM shipping_rates WHERE wilaya = $1',
    [req.params.wilaya]
  );
  if (!result.rows[0]) throw ApiError.notFound('Wilaya not found');
  res.json({ success: true, data: result.rows[0] });
});

const upsertRate = asyncHandler(async (req, res) => {
  const { wilaya } = req.params;
  const { zone, tarif_domicile, tarif_stopdesk, tarif_retour } = req.body;

  const result = await query(
    `INSERT INTO shipping_rates (wilaya, zone, tarif_domicile, tarif_stopdesk, tarif_retour)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (wilaya) DO UPDATE SET
       zone           = EXCLUDED.zone,
       tarif_domicile = EXCLUDED.tarif_domicile,
       tarif_stopdesk = EXCLUDED.tarif_stopdesk,
       tarif_retour   = EXCLUDED.tarif_retour
     RETURNING *`,
    [
      wilaya,
      parseInt(zone ?? 0, 10),
      parseFloat(tarif_domicile ?? 0),
      parseFloat(tarif_stopdesk ?? 0),
      parseFloat(tarif_retour ?? 0),
    ]
  );

  await del('cache:/api/shipping-rates');
  res.json({ success: true, data: result.rows[0] });
});

module.exports = { getAllRates, getRate, upsertRate };
