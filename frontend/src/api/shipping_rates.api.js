import { api, adminApi } from './client';

export const getAllShippingRates = async () => {
  const { data } = await api.get('/shipping-rates');
  return data.data;
};

export const getShippingRate = async (wilaya) => {
  const { data } = await api.get(`/shipping-rates/${encodeURIComponent(wilaya)}`);
  return data.data;
};

export const upsertShippingRate = async (wilaya, rateData) => {
  const { data } = await adminApi.put(`/shipping-rates/${encodeURIComponent(wilaya)}`, rateData);
  return data.data;
};
