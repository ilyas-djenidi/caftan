import { api, adminApi } from './client';

export const getProducts = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const getProduct = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data.data;
};

// Admin: includes hidden products
export const getAdminProducts = async (params = {}) => {
  const { data } = await adminApi.get('/products/admin', { params });
  return data;
};

export const getAdminProduct = async (id) => {
  const { data } = await adminApi.get(`/products/admin/${id}`);
  return data.data;
};

export const createProduct = async (formData) => {
  const { data } = await adminApi.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const updateProduct = async (id, formData) => {
  const { data } = await adminApi.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const deleteProduct = async (id) => {
  const { data } = await adminApi.delete(`/products/${id}`);
  return data;
};
