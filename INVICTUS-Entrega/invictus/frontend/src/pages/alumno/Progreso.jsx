import { useState, useEffect, useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import CabeceraPagina from '../../components/CabeceraPagina';
import PerfilProgreso from '../../components/progreso/PerfilProgreso';
import HistorialEvaluaciones from '../../components/progreso/HistorialEvaluaciones';
import { getPerfilProgreso, getHistorialProgreso } from '../../services/progresoService';
import {
  AREAS_EVALUACION,
  NOMBRES_NIVEL_DEPORTIVO,
  COLORES_NIVEL_DEPORTIVO,
  NOMBRES_NIVEL,
  NOMBRES_TIPO_EVALUACION,
  ESTADOS_PROGRESO,
  formatearFecha,
} from '../../utils/progresoUtils';

function AlumnoProgreso() {
  const { user } = useAuth();
  const alumnoId = user?.id_usuario ?? user?.id;
  const [perfil, setPerfil] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (!alumnoId) return;
    const cargar = async () => {
      setLoading(true);
      try {
        const [perf, hist] = await Promise.all([
          getPerfilProgreso(alumnoId),
          getHistorialProgreso(alumnoId),
        ]);
        setPerfil(perf);
        setHistorial(hist.historial || []);
      } catch {
        setError('Error al cargar tu progreso deportivo');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [alumnoId]);

  const alumno = perfil?.alumno;
  const ultima = perfil?.ultima_evaluacion;
  const nivel = ultima?.nivel_deportivo || alumno?.nivel_deportivo;
  const estado = perfil?.estado_progreso || 'Sin evaluación';
  const promedios = perfil?.promedios_areas;

  const datosRadar = useMemo(
    () => AREAS_EVALUACION.map((area) => ({ area: area.label, valor: promedios?.[area.clave] ?? 0 })),
    [promedios]
  );

  const historialTop = useMemo(
    () => [...historial]
      .sort((a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion))
      .slice(0, 6),
    [historial]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
      </div>
    );
  }

  const estadoCfg = ESTADOS_PROGRESO[estado] || ESTADOS_PROGRESO['Sin evaluación'];
  const tieneEvaluaciones = historial.length > 0;

  const stats = tieneEvaluaciones
    ? [
        { valor: ultima?.promedio_general ?? '—', etiqueta: 'promedio', color: 'text-[#172033]' },
        { valor: ultima?.porcentaje_progreso != null ? `${ultima.porcentaje_progreso}%` : '—', etiqueta: '% progreso', color: 'text-green-600' },
        { valor: perfil?.diferencia == null ? '—' : `${perfil.diferencia > 0 ? '+' : ''}${perfil.diferencia}%`, etiqueta: 'vs anterior', color: perfil?.diferencia == null ? 'text-slate-500' : perfil?.diferencia >= 0 ? 'text-green-600' : 'text-red-600' },
        { valor: historial.length, etiqueta: 'evaluaciones', color: 'text-invictus-600' },
        { valor: formatearFecha(ultima?.fecha_evaluacion), etiqueta: 'última evaluación', color: 'text-[#172033]' },
      ]
    : [];

  return (
    <div>
      <CabeceraPagina
        titulo="Mi Progreso Deportivo"
        subtitulo="Consulta tus evaluaciones y evolución en la academia"
        stats={stats}
        acciones={
          <>
            <button
              onClick={() => setModal('perfil')}
              className="px-4 py-2 text-sm font-medium text-invictus-700 bg-invictus-50 hover:bg-invictus-100 rounded-lg transition-colors"
            >
              Ver perfil de progreso
            </button>
            <button
              onClick={() => setModal('historial')}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Ver historial de evaluaciones
            </button>
          </>
        }
      />

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Cabecera del alumno */}
      <div className="mb-5 bg-gradient-to-r from-invictus-600 to-invictus-700 rounded-2xl p-6 text-white shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
            {(alumno?.alumno_nombre || user?.nombre || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xl font-bold">{alumno?.alumno_nombre || user?.nombre}</h4>
              {nivel && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white text-invictus-700">
                  {NOMBRES_NIVEL_DEPORTIVO[nivel] || nivel}
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoCfg.color}`}>{estado}</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-white/85">
              {alumno?.nombre_turno && <span><strong className="text-white">Turno:</strong> {alumno.nombre_turno}</span>}
              {alumno?.entrenador_nombre && <span><strong className="text-white">Entrenador:</strong> {alumno.entrenador_nombre}</span>}
              {alumno?.fecha_inscripcion && <span><strong className="text-white">Ingreso:</strong> {formatearFecha(alumno.fecha_inscripcion)}</span>}
            </div>
          </div>
        </div>
      </div>

      {!tieneEvaluaciones ? (
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 text-center py-16 px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-invictus-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-invictus-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#172033]">Aún no tienes evaluaciones registradas</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Tu entrenador registrará tu nivel, técnica y evolución en tu próxima evaluación. Vuelve pronto para ver tu seguimiento deportivo aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Radar por áreas */}
          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 p-5">
            <h4 className="font-semibold text-[#172033] mb-2">Promedios por área</h4>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={datosRadar} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid />
                <PolarAngleAxis dataKey="area" tick={{ fontSize: 11 }} />
                <Radar name="Promedio" dataKey="valor" stroke="#00A878" fill="#00A878" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Últimas evaluaciones */}
          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h4 className="font-semibold text-[#172033]">Últimas evaluaciones</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                    <th className="px-5 py-2.5 font-semibold">Fecha</th>
                    <th className="px-5 py-2.5 font-semibold">Tipo</th>
                    <th className="px-5 py-2.5 font-semibold text-center">Nivel</th>
                    <th className="px-5 py-2.5 font-semibold text-center">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {historialTop.map((h) => (
                    <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-2.5 text-sm text-[#172033] whitespace-nowrap">{formatearFecha(h.fecha_evaluacion)}</td>
                      <td className="px-5 py-2.5 text-sm text-slate-600">{NOMBRES_TIPO_EVALUACION[h.tipo_evaluacion] || '—'}</td>
                      <td className="px-5 py-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ${COLORES_NIVEL_DEPORTIVO[h.nivel] || 'bg-gray-100 text-gray-700'}`}>
                          {NOMBRES_NIVEL[h.nivel] || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className="font-semibold text-[#172033]">{h.promedio_general ?? '—'}</span>
                        {h.porcentaje_progreso != null && (
                          <span className="text-[10px] text-slate-400 ml-0.5">({h.porcentaje_progreso}%)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modal === 'perfil' && (
        <PerfilProgreso alumnoId={alumnoId} readOnly onClose={() => setModal(null)} />
      )}
      {modal === 'historial' && (
        <HistorialEvaluaciones
          alumnoId={alumnoId}
          alumnoNombre={user?.nombre}
          readOnly
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

export default AlumnoProgreso;