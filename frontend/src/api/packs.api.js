import { api, adminApi } from './client';

export const getPacks = async () => {
  const { data } = await api.get('/packs');
  return data;  // returns { success, data: [...] } — caller destructures { data }
};

export const getPack = async (id) => {
  const { data } = await api.get(`/packs/${id}`);
  return data.data;
};

export const getAdminPacks = async () => {
  const { data } = await adminApi.get('/packs/admin');
  return data.data;
};

export const createPack = async (formData) => {
  const { data } = await adminApi.post('/packs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const updatePack = async (id, formData) => {
  const { data } = await adminApi.put(`/packs/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const deletePack = async (id) => {
  const { data } = await adminApi.delete(`/packs/${id}`);
  return data;
};
