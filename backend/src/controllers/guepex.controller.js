'use strict';

const guepex = require('../services/guepex.service');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

const getWilayas = asyncHandler(async (req, res) => {
  const data = await guepex.getWilayas();
  res.json({ success: true, data });
});

const getCommunes = asyncHandler(async (req, res) => {
  const data = await guepex.getCommunes(req.params.wilayaId);
  res.json({ success: true, data });
});

const getCenters = asyncHandler(async (req, res) => {
  const data = await guepex.getCenters(req.params.wilayaId);
  res.json({ success: true, data });
});

const getFees = asyncHandler(async (req, res) => {
  const { fromWilaya, toWilaya } = req.params;
  const data = await guepex.getFees(fromWilaya, toWilaya);
  res.json({ success: true, data: data ?? null });
});

const getAllParcels = asyncHandler(async (req, res) => {
  try {
    const data = await guepex.getAllParcels(req.query.page);
    res.json({ success: true, data });
  } catch (e) {
    if (e.statusCode === 404) return res.json({ success: true, data: { data: [], has_more: false } });
    throw e;
  }
});

const getParcel = asyncHandler(async (req, res) => {
  const data = await guepex.getParcel(req.params.tracking);
  res.json({ success: true, data });
});

const getParcelHistory = asyncHandler(async (req, res) => {
  const data = await guepex.getParcelHistory(req.params.tracking);
  res.json({ success: true, data });
});

const createParcel = asyncHandler(async (req, res) => {
  const data = await guepex.createParcel(req.body);
  res.status(201).json({ success: true, data });
});

const updateParcel = asyncHandler(async (req, res) => {
  const data = await guepex.updateParcel(req.params.tracking, req.body);
  res.json({ success: true, data });
});

const cancelParcel = asyncHandler(async (req, res) => {
  const data = await guepex.cancelParcel(req.params.tracking);
  res.json({ success: true, data });
});

const printLabel = asyncHandler(async (req, res) => {
  const data = await guepex.getPrintLabel(req.params.tracking);
  const labelUrl = data?.data?.[0]?.label;
  if (!labelUrl) {
    return res.status(404).send('Bordereau introuvable ou invalide');
  }
  res.redirect(labelUrl);
});

module.exports = {
  getWilayas, getCommunes, getCenters, getFees,
  getAllParcels, getParcel, getParcelHistory,
  createParcel, updateParcel, cancelParcel, printLabel,
};
