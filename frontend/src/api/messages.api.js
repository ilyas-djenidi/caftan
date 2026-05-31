import { api, adminApi } from './client';

export const sendMessage = async (messageData) => {
  const { data } = await api.post('/messages', messageData);
  return data.data;
};

export const getMessages = async (params = {}) => {
  const { data } = await adminApi.get('/messages', { params });
  return data;
};

export const markAsRead = async (id) => {
  const { data } = await adminApi.put(`/messages/${id}/read`);
  return data.data;
};

export const updateMessageStatus = async (id, status) => {
  const { data } = await adminApi.put(`/messages/${id}/status`, { status });
  return data.data;
};

export const deleteMessage = async (id) => {
  const { data } = await adminApi.delete(`/messages/${id}`);
  return data;
};
