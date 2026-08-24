import api from './api';

export const getMisHorariosEntrenador = async () => {
  const response = await api.get('/entrenador/mis-horarios');
  return response.data;
};

export const getMisAlumnosEntrenador = async () => {
  const response = await api.get('/entrenador/mis-alumnos');
  return response.data;
};
