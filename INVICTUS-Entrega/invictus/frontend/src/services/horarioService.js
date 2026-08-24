import api from './api';

export const getHorarios = async (params = {}) => {
  const response = await api.get('/horarios', { params });
  return response.data;
};

export const getGrilla = async () => {
  const response = await api.get('/horarios/grilla');
  return response.data;
};

export const getHorario = async (id) => {
  const response = await api.get(`/horarios/${id}`);
  return response.data;
};

export const createHorario = async (data) => {
  const response = await api.post('/horarios', data);
  return response.data;
};

export const updateHorario = async (id, data) => {
  const response = await api.put(`/horarios/${id}`, data);
  return response.data;
};

export const deleteHorario = async (id) => {
  const response = await api.delete(`/horarios/${id}`);
  return response.data;
};
