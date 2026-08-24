import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats } from '../../services/dashboardService';
import ClasesHoyCard from '../../components/ClasesHoyCard';

const quickLinks = [
  { label: 'Registrar Usuario', path: '/admin/register', icon: '➕', color: 'bg-indigo-500', desc: 'Crear nuevo usuario' },
  { label: 'Gestionar Usuarios', path: '/admin/manage', icon: '📋', color: 'bg-purple-500', desc: 'Administrar usuarios' },
  { label: 'Alumnos', path: '/admin/alumnos', icon: '🏋️', color: 'bg-blue-500', desc: 'Gestionar alumnos' },
  { label: 'Entrenadores', path: '/admin/entrenadores', icon: '🥊', color: 'bg-green-500', desc: 'Ver entrenadores' },
  { label: 'Pagos', path: '/admin/pagos', icon: '💰', color: 'bg-amber-500', desc: 'Registrar pagos' },
  { label: 'Asistencias', path: '/admin/asistencias', icon: '📋', color: 'bg-teal-500', desc: 'Control de asistencia' },
  { label: 'Horarios', path: '/admin/horarios', icon: '🕐', color: 'bg-rose-500', desc: 'Gestión de horarios' },
  { label: 'Reportes', path: '/admin/reportes', icon: '📈', color: 'bg-cyan-500', desc: 'Reportes del sistema' },
];

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = user?.rol === 'SuperAdmin';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch {
        setStats({ total_alumnos: 0, total_entrenadores: 0, ingresos_mes: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          {isSuperAdmin ? 'Panel de Súper Administrador' : 'Panel de Administración'}
        </h2>
        <p className="text-gray-500 mt-1">
          Bienvenido, {user?.nombre}. {isSuperAdmin ? 'Tienes acceso total al sistema.' : 'Gestiona la academia desde aquí.'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard title="Alumnos" value={stats?.total_alumnos ?? 0} icon="🏋️" color="bg-blue-500" />
            <StatCard title="Entrenadores" value={stats?.total_entrenadores ?? 0} icon="🥊" color="bg-green-500" />
            <StatCard title="Ingresos Mes" value={`Bs ${(stats?.ingresos_mes ?? 0).toLocaleString()}`} icon="💰" color="bg-amber-500" />
            {isSuperAdmin && (
              <>
                <StatCard title="Administradores" value={stats?.total_administradores ?? 0} icon="👤" color="bg-indigo-500" />
                <StatCard title="Recepcionistas" value={stats?.total_recepcionistas ?? 0} icon="🖥️" color="bg-teal-500" />
              </>
            )}
          </div>

          <div className="mb-8">
            <ClasesHoyCard
              clases_hoy={stats?.clases_hoy}
              clases_hoy_detalles={stats?.clases_hoy_detalles}
              dia_nombre={stats?.dia_nombre}
              horarios_semana={stats?.horarios_semana}
            />
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all text-left hover:-translate-y-0.5"
              >
                <div className={`w-10 h-10 ${link.color} rounded-lg flex items-center justify-center text-xl mb-3`}>
                  {link.icon}
                </div>
                <h4 className="font-semibold text-gray-800 text-sm">{link.label}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;