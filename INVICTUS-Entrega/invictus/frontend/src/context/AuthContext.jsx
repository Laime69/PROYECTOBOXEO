import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (correo, password) => {
    const data = await loginApi(correo, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const getRedirectPath = useCallback(() => {
    if (!user) return '/login';
    switch (user.rol) {
      case 'SuperAdmin':
        return '/admin/dashboard';
      case 'Administrador':
        return '/admin/dashboard';
      case 'Recepcionista':
        return '/recepcion/dashboard';
      case 'Entrenador':
        return '/entrenador/dashboard';
      case 'Alumno':
        return '/alumno/dashboard';
      default:
        return '/login';
    }
  }, [user]);

  const value = { user, token, loading, login, logout, getRedirectPath };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
