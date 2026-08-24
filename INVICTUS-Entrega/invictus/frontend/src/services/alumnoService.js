import api from './api';

export const getMiDashboard = async () => {
  const response = await api.get('/alumno/dashboard');
  return response.data;
};

export const getMiPerfil = async () => {
  const response = await api.get('/alumno/perfil');
  return response.data;
};

export const getMisHorarios = async () => {
  const response = await api.get('/alumno/horarios');
  return response.data;
};

export const getMisAsistencias = async (params = {}) => {
  const response = await api.get('/alumno/asistencias', { params });
  return response.data;
};

export const getMiEstadoPago = async () => {
  const response = await api.get('/alumno/pago');
  return response.data;
};
