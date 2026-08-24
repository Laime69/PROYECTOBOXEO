import api from './api';

export const asignarHorario = async (alumnoId, horarioId, observacion) => {
  const response = await api.post(`/alumnos/${alumnoId}/asignar-horario`, { horario_id: horarioId, observacion });
  return response.data;
};

export const asignarTurno = async (alumnoId, turno, observacion) => {
  const response = await api.post(`/alumnos/${alumnoId}/asignar-turno`, { turno, observacion });
  return response.data;
};

export const cambiarHorario = async (alumnoId, horarioId, observacion) => {
  const response = await api.post(`/alumnos/${alumnoId}/cambiar-horario`, { horario_id: horarioId, observacion });
  return response.data;
};

export const cambiarTurno = async (alumnoId, turno, observacion) => {
  const response = await api.post(`/alumnos/${alumnoId}/cambiar-turno`, { turno, observacion });
  return response.data;
};

export const getHorarioActual = async (alumnoId) => {
  const response = await api.get(`/alumnos/${alumnoId}/horario-actual`);
  return response.data;
};

export const getAlumnosByHorario = async (horarioId) => {
  const response = await api.get(`/horarios/${horarioId}/alumnos`);
  return response.data;
};

export const getAlumnosByTurno = async (turno) => {
  const response = await api.get(`/turnos/${turno}/alumnos`);
  return response.data;
};
