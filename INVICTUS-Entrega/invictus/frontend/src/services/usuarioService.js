import api from './api';

export const registerUser = async (data) => {
  const response = await api.post('/usuarios', data);
  return response.data;
};

export const getUsers = async (rol = null, extraParams = {}) => {
  const params = { ...extraParams };
  if (rol) params.rol = rol;
  const response = await api.get('/usuarios', { params });
  return response.data;
};

export const getUsuarioDetalle = async (id) => {
  const response = await api.get(`/usuarios/${id}`);
  return response.data;
};

export const getMiPerfil = async () => {
  const response = await api.get('/usuarios/me');
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/usuarios/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/usuarios/${id}`);
  return response.data;
};
