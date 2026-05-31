import { api, adminApi } from './client';

export const getReviews = async (productId) => {
  const { data } = await api.get(`/reviews/product/${productId}`);
  return data.data;
};

export const createReview = async (productId, reviewData) => {
  const { data } = await api.post(`/reviews/product/${productId}`, reviewData);
  return data.data;
};

export const getAdminReviews = async (params = {}) => {
  const { data } = await adminApi.get('/reviews', { params });
  return data;
};

export const updateReviewStatus = async (id, status) => {
  const { data } = await adminApi.put(`/reviews/${id}/status`, { status });
  return data.data;
};

export const deleteReview = async (id) => {
  const { data } = await adminApi.delete(`/reviews/${id}`);
  return data;
};
