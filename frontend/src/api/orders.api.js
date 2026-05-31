import { api, adminApi } from './client';

export const createOrder = async (orderData) => {
  const { data } = await api.post('/orders', orderData);
  return data.data;
};

export const getAdminOrders = async (params = {}) => {
  const { data } = await adminApi.get('/orders', { params });
  return data;
};

export const getOrderById = async (id) => {
  const { data } = await adminApi.get(`/orders/${id}`);
  return data.data;
};

export const confirmOrder = async (id) => {
  const { data } = await adminApi.put(`/orders/${id}/status`, { status: 'confirmed' });
  return data.data;
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await adminApi.put(`/orders/${id}/status`, { status });
  return data.data;
};

export const updateOrderGuepex = async (id, fields) => {
  const { data } = await adminApi.put(`/orders/${id}/guepex`, fields);
  return data.data;
};

export const deleteOrder = async (id) => {
  const { data } = await adminApi.delete(`/orders/${id}`);
  return data;
};

export const getShippedOrders = async () => {
  const { data } = await adminApi.get('/orders/shipped');
  return data.data;
};

export const getDeliveryStats = async () => {
  const { data } = await adminApi.get('/orders/delivery-stats');
  return data.data;
};

export const getGuepexDeliveryStats = getDeliveryStats;

export const getFilteredStats = async (params = {}) => {
  const { data } = await adminApi.get('/orders/delivery-stats', { params });
  return data.data;
};
