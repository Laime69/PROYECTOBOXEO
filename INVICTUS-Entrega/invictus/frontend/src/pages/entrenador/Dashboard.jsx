import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats } from '../../services/dashboardService';
import ClasesHoyCard from '../../components/ClasesHoyCard';

const quickLinks = [
  { label: 'Mis Horarios', path: '/entrenador/horarios', icon: '🕐', color: 'bg-purple-500', desc: 'Consulta tus clases' },
  { label: 'Mis Alumnos', path: '/entrenador/alumnos', icon: '🏋️', color: 'bg-blue-500', desc: 'Lista de alumnos' },
  { label: 'Asistencias', path: '/entrenador/asistencias', icon: '📋', color: 'bg-teal-500', desc: 'Registrar asistencias' },
  { label: 'Reportes', path: '/entrenador/reportes', icon: '📈', color: 'bg-amber-500', desc: 'Reportes de asistencias' },
];

function EntrenadorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch {
        setStats({ total_alumnos: 0, total_entrenadores: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#172033]">Panel de Entrenador</h2>
        <p className="text-slate-500 mt-1">
          Bienvenido, {user?.nombre}. Revisa tus clases y alumnos.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total Alumnos</p>
                  <p className="text-2xl font-bold text-[#172033] mt-1">{stats?.total_alumnos ?? 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">🏋️</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Entrenadores</p>
                  <p className="text-2xl font-bold text-[#172033] mt-1">{stats?.total_entrenadores ?? 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-2xl">🥊</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Alumnos Pagados</p>
                  <p className="text-2xl font-bold text-[#172033] mt-1">{stats?.alumnos_pagados ?? 0}</p>
                </div>
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center text-2xl">✅</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <ClasesHoyCard
              clases_hoy={stats?.clases_hoy}
              clases_hoy_detalles={stats?.clases_hoy_detalles}
              dia_nombre={stats?.dia_nombre}
              horarios_semana={stats?.horarios_semana}
            />
          </div>

          <h3 className="text-lg font-semibold text-[#172033] mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-5 hover:shadow-md transition-all text-left hover:-translate-y-0.5"
              >
                <div className={`w-10 h-10 ${link.color} rounded-lg flex items-center justify-center text-xl mb-3`}>
                  {link.icon}
                </div>
                <h4 className="font-semibold text-[#172033] text-sm">{link.label}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{link.desc}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default EntrenadorDashboard;
