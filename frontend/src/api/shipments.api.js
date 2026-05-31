import { adminApi } from './client';

export const getShipments = async () => {
  const { data } = await adminApi.get('/shipments');
  return data.data;
};

export const upsertShipment = async (shipmentData) => {
  const { data } = await adminApi.post('/shipments', shipmentData);
  return data.data;
};

export const updateShipmentStatus = async (tracking, status, orderNumber) => {
  const { data } = await adminApi.put(`/shipments/${tracking}/status`, { status, orderNumber });
  return data.data;
};

export const getShipmentLabelUrl = (tracking) => {
  const token = localStorage.getItem('admin_token');
  const apiUrl = import.meta.env.VITE_API_URL || '';
  return `${apiUrl}/api/guepex/parcels/${tracking}/label?token=${token}`;
};
