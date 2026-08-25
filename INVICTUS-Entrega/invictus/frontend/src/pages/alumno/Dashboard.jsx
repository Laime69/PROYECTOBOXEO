import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMiDashboard } from '../../services/alumnoService';
import ClasesHoyCard from '../../components/ClasesHoyCard';

const quickLinks = [
  { label: 'Mi Perfil', path: '/alumno/perfil', icon: '👤', color: 'bg-blue-500', desc: 'Ver mis datos personales' },
  { label: 'Horarios', path: '/alumno/horarios', icon: '🕐', color: 'bg-purple-500', desc: 'Clases disponibles' },
  { label: 'Asistencias', path: '/alumno/asistencias', icon: '📋', color: 'bg-teal-500', desc: 'Mis asistencias' },
  { label: 'Estado de Pago', path: '/alumno/pago', icon: '💰', color: 'bg-green-500', desc: 'Mi membresía' },
];

function AlumnoDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMiDashboard();
        setData(res.dashboard);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getPagoBadge = (estado) => {
    const styles = {
      pagado: 'bg-green-100 text-green-800',
      pendiente: 'bg-amber-100 text-amber-800',
      vencido: 'bg-red-100 text-red-800',
    };
    if (!estado) return null;
    const label = estado === 'pagado' ? 'Pagado' : estado === 'vencido' ? 'Vencido' : 'Pendiente';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-[#172033]'}`}>{label}</span>;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#172033]">Panel de Alumno / Deportista</h2>
        <p className="text-slate-500 mt-1">
          Bienvenido, {user?.nombre}. Aquí puedes ver tu información y progreso.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Estado de Pago</p>
                  <div className="mt-2">{getPagoBadge(data?.estado_pago)}</div>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-2xl">💰</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Mi Horario</p>
                  <p className="text-lg font-bold text-[#172033] mt-1">
                    {data?.horario_asignado ? `${data.horario_asignado.nombre_turno} – ${data.horario_asignado.clase}` : 'Sin asignar'}
                  </p>
                  {data?.horario_asignado && (
                    <p className="text-xs text-gray-400 mt-0.5">{data.horario_asignado.dias} {data.horario_asignado.hora_inicio?.slice(0,5)}–{data.horario_asignado.hora_fin?.slice(0,5)}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-2xl">🕐</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Asistencias</p>
                  <p className="text-2xl font-bold text-[#172033] mt-1">{data?.total_asistencias ?? 0}</p>
                </div>
                <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center text-2xl">📋</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Asistencia %</p>
                  <p className={`text-2xl font-bold mt-1 ${data?.porcentaje_asistencia === null ? 'text-gray-400' : data?.porcentaje_asistencia >= 75 ? 'text-green-600' : data?.porcentaje_asistencia >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {data?.porcentaje_asistencia !== null ? `${data.porcentaje_asistencia}%` : '—'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center text-2xl">📊</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <ClasesHoyCard
              clases_hoy={data?.clases_hoy}
              clases_hoy_detalles={data?.clases_hoy_detalles}
              dia_nombre={data?.dia_nombre}
              horarios_semana={data?.horarios_semana}
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

export default AlumnoDashboard;
