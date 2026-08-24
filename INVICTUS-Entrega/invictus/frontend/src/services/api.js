import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({ response: { data: { msg: 'Error de conexión con el servidor. Verifique su conexión a internet.' }, status: 0 } });
    }
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname === '/login';
      if (!isLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403) {
      const data = error.response.data;
      error.displayMsg = data?.msg || 'No tiene permiso para realizar esta acción.';
    }
    return Promise.reject(error);
  }
);

export default api;
