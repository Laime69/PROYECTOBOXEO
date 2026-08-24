import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [form, setForm] = useState({ correo: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!form.correo.trim()) {
      newErrors.correo = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
      newErrors.correo = 'Formato de correo inválido';
    }

    if (!form.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setServerError('');

    try {
      const data = await login(form.correo.trim(), form.password);
      const path =
        data.user.rol === 'SuperAdmin' || data.user.rol === 'Administrador'
          ? '/admin/dashboard'
          : data.user.rol === 'Recepcionista'
          ? '/recepcion/dashboard'
          : data.user.rol === 'Entrenador'
          ? '/entrenador/dashboard'
          : '/alumno/dashboard';
      navigate(path, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.msg || 'Error al conectar con el servidor';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🥊</div>
          <h2 className="text-2xl font-bold text-white">Invictus Boxeo</h2>
          <p className="text-gray-300 text-sm mt-1">Sistema de Gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              placeholder="admin@invictus.com"
              className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-invictus-500 transition-colors ${
                errors.correo ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {errors.correo && (
              <p className="mt-1 text-xs text-red-400">{errors.correo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-invictus-500 transition-colors ${
                errors.password ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          {serverError && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-4 py-3 text-sm text-red-300 text-center">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-invictus-600 hover:bg-invictus-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-6">
          Academia de Boxeo Invictus © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default Login;
