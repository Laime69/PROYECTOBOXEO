import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function ProtectedRoute({ children, rol, roles }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" replace />;

  if (user.rol === 'SuperAdmin') return children;

  const allowedRoles = roles || (rol ? [rol] : []);

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    const roleRedirects = {
      SuperAdmin: '/admin/dashboard',
      Administrador: '/admin/dashboard',
      Recepcionista: '/recepcion/dashboard',
      Entrenador: '/entrenador/dashboard',
      Alumno: '/alumno/dashboard',
    };
    const redirectPath = roleRedirects[user.rol] || '/login';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 max-w-md">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-[#172033] mb-2">Acceso denegado</h2>
          <p className="text-slate-500 mb-4">No tiene permiso para acceder a esta sección.</p>
          <button
            onClick={() => navigate(redirectPath)}
            className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;