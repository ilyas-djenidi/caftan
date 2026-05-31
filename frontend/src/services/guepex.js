import { api, adminApi } from '../api/client';

// Public endpoints (no auth — used during checkout for fee lookup)
export const getWilayas = async () => {
  const { data } = await api.get('/guepex/wilayas');
  return data.data;
};

export const getCommunes = async (wilayaId) => {
  const { data } = await api.get(`/guepex/communes/${wilayaId}`);
  return data.data;
};

export const getCenters = async (wilayaId) => {
  const { data } = await api.get(`/guepex/centers/${wilayaId}`);
  return data.data;
};

export const getFees = async (fromWilayaId, toWilayaId) => {
  const { data } = await api.get(`/guepex/fees/${fromWilayaId}/${toWilayaId}`);
  return data.data;
};

// Admin endpoints
export const getAllParcels = async (page = 1) => {
  const { data } = await adminApi.get('/guepex/parcels', { params: { page } });
  return data.data;
};

export const getParcel = async (tracking) => {
  const { data } = await adminApi.get(`/guepex/parcels/${tracking}`);
  return data.data;
};

export const getParcelHistory = async (tracking) => {
  const { data } = await adminApi.get(`/guepex/parcels/${tracking}/history`);
  return data.data;
};

export const createParcel = async (parcelData) => {
  const { data } = await adminApi.post('/guepex/parcels', parcelData);
  return data.data;
};

export const updateParcel = async (tracking, parcelData) => {
  const { data } = await adminApi.put(`/guepex/parcels/${tracking}`, parcelData);
  return data.data;
};

export const cancelParcel = async (tracking) => {
  const { data } = await adminApi.delete(`/guepex/parcels/${tracking}`);
  return data.data;
};

export const getPrintLabel = async (tracking) => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  return `${apiUrl}/api/guepex/parcels/${tracking}/label`;
};

export const getStatusColor = (status) => {
  const map = {
    'En attente': '#f59e0b',
    'Ramassé': '#3b82f6',
    'En transit': '#8b5cf6',
    'Livré': '#10b981',
    'Retourné': '#ef4444',
    'Annulé': '#6b7280',
  };
  return map[status] || '#6b7280';
};
