import api from './api';

export const login = async (correo, password) => {
  const response = await api.post('/auth/login', { correo, password });
  return response.data;
};

export const getPerfil = async () => {
  const response = await api.get('/auth/perfil');
  return response.data;
};
