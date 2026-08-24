import api from './api';

export const getAsistencias = async (params = {}) => {
  const response = await api.get('/asistencias', { params });
  return response.data;
};

export const getAsistencia = async (id) => {
  const response = await api.get(`/asistencias/${id}`);
  return response.data;
};

export const createAsistencia = async (data) => {
  const response = await api.post('/asistencias', data);
  return response.data;
};

export const updateAsistencia = async (id, data) => {
  const response = await api.put(`/asistencias/${id}`, data);
  return response.data;
};

export const deleteAsistencia = async (id) => {
  const response = await api.delete(`/asistencias/${id}`);
  return response.data;
};
