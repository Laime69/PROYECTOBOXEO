import api from './api';

export const getProgresos = async (params = {}) => {
  const response = await api.get('/progresos', { params });
  return response.data;
};

export const getListaAlumnos = async (params = {}) => {
  const response = await api.get('/progresos/alumnos', { params });
  return response.data;
};

export const getProgreso = async (id) => {
  const response = await api.get(`/progresos/${id}`);
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

export const deleteProgreso = async (id) => {
  const response = await api.delete(`/progresos/${id}`);
  return response.data;
};

export const getHistorialProgreso = async (alumnoId) => {
  const response = await api.get(`/progresos/alumno/${alumnoId}`);
  return response.data;
};

export const getPerfilProgreso = async (alumnoId) => {
  const response = await api.get(`/progresos/alumno/${alumnoId}/perfil`);
  return response.data;
};

export const getGraficosProgreso = async (alumnoId) => {
  const response = await api.get(`/progresos/alumno/${alumnoId}/graficos`);
  return response.data;
};

export const compararEvaluaciones = async (id1, id2) => {
  const response = await api.post('/progresos/comparar', { id1, id2 });
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
