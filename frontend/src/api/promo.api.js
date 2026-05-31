import { api, adminApi } from './client';

export const validatePromo = async (code, total) => {
  const { data } = await api.post('/promo/validate', { code, total });
  return data.data;
};

export const getAdminPromos = async () => {
  const { data } = await adminApi.get('/promo');
  return data.data;
};

export const createPromo = async (promoData) => {
  const { data } = await adminApi.post('/promo', promoData);
  return data.data;
};

export const updatePromo = async (id, promoData) => {
  const { data } = await adminApi.put(`/promo/${id}`, promoData);
  return data.data;
};

export const deletePromo = async (id) => {
  const { data } = await adminApi.delete(`/promo/${id}`);
  return data;
};
