import api from './api';

export const getPagos = async (params = {}) => {
  const response = await api.get('/pagos', { params });
  return response.data;
};

export const marcarPagado = async (data) => {
  const response = await api.post('/pagos/marcar-pagado', data);
  return response.data;
};

export const actualizarPago = async (id, data) => {
  const response = await api.patch(`/pagos/${id}`, data);
  return response.data;
};

export const getResumenPagos = async (params = {}) => {
  const response = await api.get('/pagos/resumen', { params });
  return response.data;
};

export const getHistorialAlumno = async (id) => {
  const response = await api.get(`/pagos/alumno/${id}/historial`);
  return response.data;
};
