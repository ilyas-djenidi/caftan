import { adminApi } from './client';

export const getDashboardStats = async () => {
  const { data } = await adminApi.get('/stats/dashboard');
  return data.data;
};

export const getSiteContent = async () => {
  const { data } = await adminApi.get('/settings');
  return data.data ?? {};
};

export const updateSiteContent = async (key, value) => {
  const { data } = await adminApi.put(`/settings/${key}`, { value });
  return data.data;
};
