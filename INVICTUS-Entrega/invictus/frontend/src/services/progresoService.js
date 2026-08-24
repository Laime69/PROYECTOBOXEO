import api from './api';

export const getProgresos = async (params = {}) => {
  const response = await api.get('/progresos', { params });
  return response.data;
};

export const createProgreso = async (data) => {
  const response = await api.post('/progresos', data);
  return response.data;
};

export const updateProgreso = async (id, data) => {
  const response = await api.put(`/progresos/${id}`, data);
  return response.data;
};

export const getHistorialProgreso = async (alumnoId) => {
  const response = await api.get(`/progresos/alumno/${alumnoId}`);
  return response.data;
};

export const getMisProgresos = async () => {
  const response = await api.get('/progresos/mis-progresos');
  return response.data;
};

export const getResumenProgreso = async (params = {}) => {
  const response = await api.get('/progresos/reportes/resumen', { params });
  return response.data;
};
