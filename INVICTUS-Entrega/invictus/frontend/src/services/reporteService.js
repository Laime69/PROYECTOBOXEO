import api from './api';

export const getResumenGeneral = async () => {
  const response = await api.get('/reportes/general');
  return response.data;
};

export const getReportePagos = async (params = {}) => {
  const response = await api.get('/reportes/pagos', { params });
  return response.data;
};

export const getResumenPagos = async ({ mes, anio } = {}) => {
  const data = await getReportePagos({ mes, anio });
  return { resumen: data.datos?.resumen ?? data.resumen };
};

export const getAsistenciasEntrenador = async (fecha_inicio, fecha_fin) => {
  const response = await api.get('/reportes/entrenador', {
    params: { fecha_inicio, fecha_fin },
  });
  return response.data;
};

export const getAsistenciasFiltradas = async (params = {}) => {
  const response = await api.get('/reportes/asistencias', { params });
  return response.data;
};

export default {
  getResumenGeneral,
  getReportePagos,
  getResumenPagos,
  getAsistenciasEntrenador,
  getAsistenciasFiltradas,
};
