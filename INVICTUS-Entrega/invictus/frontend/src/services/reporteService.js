import api from './api';

export const getResumenGeneral = async () => {
  const response = await api.get('/reportes/general');
  return response.data;
};

export const getResumenPagos = async () => {
  const response = await api.get('/reportes/pagos');
  return response.data;
};

export const getAsistenciasEntrenador = async (fecha_inicio, fecha_fin) => {
  const response = await api.get('/reportes/entrenador', {
    params: { fecha_inicio, fecha_fin },
  });
  return response.data;
};

export const getAsistenciasPorFecha = async (fecha_inicio, fecha_fin) => {
  const response = await api.get('/reportes/asistencias', {
    params: { fecha_inicio, fecha_fin },
  });
  return response.data;
};
