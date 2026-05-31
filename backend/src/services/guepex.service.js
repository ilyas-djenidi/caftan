'use strict';

const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const client = axios.create({
  baseURL: `${env.guepex.baseUrl}/v1`,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-API-ID': env.guepex.apiId,
    'X-API-TOKEN': env.guepex.apiToken,
  },
});

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status ?? 500;
    const msg = err.response?.data?.message ?? err.message;
    logger.warn('Guepex API error', { status, msg });
    throw new ApiError(status >= 500 ? 502 : status, `Guepex: ${msg}`);
  }
);

const guepex = {
  getWilayas: () => client.get('/wilayas'),
  getCommunes: (wilayaId) => client.get(`/communes/${wilayaId}`),
  getCenters: (wilayaId) => client.get(`/centers/${wilayaId}`),
  getFees: async (fromWilayaId, toWilayaId) => {
    try {
      return await client.get(`/fees/${fromWilayaId}/${toWilayaId}`);
    } catch (e) {
      logger.warn('Guepex getFees failed (non-fatal)', { msg: e.message });
      return null;
    }
  },

  getAllParcels: (page = 1) => client.get('/parcels', { params: { page } }),
  getParcel: (tracking) => client.get(`/parcels/${tracking}`),
  getParcelHistory: (tracking) => client.get(`/parcels/${tracking}/history`),

  createParcel: (data) => client.post('/parcels', data),
  updateParcel: (tracking, data) => client.put(`/parcels/${tracking}`, data),
  cancelParcel: (tracking) => client.delete(`/parcels/${tracking}`),

  // Returns a redirect URL to the PDF label
  getPrintLabel: (tracking) => client.get(`/parcels/${tracking}/label`),
};

module.exports = guepex;
