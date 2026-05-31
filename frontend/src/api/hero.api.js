import { api, adminApi } from './client';

export const getHeroBanners = async () => {
  const { data } = await api.get('/hero');
  return data.data;
};

export const getAdminHeroBanners = async () => {
  const { data } = await adminApi.get('/hero/admin');
  return data.data;
};

export const createHeroBanner = async (formData) => {
  const { data } = await adminApi.post('/hero', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const updateHeroBanner = async (id, formData) => {
  const { data } = await adminApi.put(`/hero/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const deleteHeroBanner = async (id) => {
  const { data } = await adminApi.delete(`/hero/${id}`);
  return data;
};
