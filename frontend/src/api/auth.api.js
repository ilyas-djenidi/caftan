import { adminApi } from './client';

export const login = async ({ email, password }) => {
  const { data } = await adminApi.post('/auth/login', { email, password });
  if (data.token) {
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
  }
  return data;
};

export const getMe = async () => {
  const { data } = await adminApi.get('/auth/me');
  return data;
};

export const logout = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
};
