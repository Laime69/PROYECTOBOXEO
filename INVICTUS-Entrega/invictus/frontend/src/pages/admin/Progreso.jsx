import { useState, useEffect } from 'react';
import { useTituloPagina } from '../../hooks/useTituloPagina';
import { getResumenProgreso, getHistorialProgreso } from '../../services/progresoService';
import ActionButton from '../../components/ActionButton';
import CabeceraPagina from '../../components/CabeceraPagina';

const NIVELES = ['', 'inicial', 'basico', 'intermedio', 'avanzado', 'competitivo'];
const NOMBRES_NIVEL = { inicial: 'Inicial', basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado', competitivo: 'Competitivo' };
const COLORES_NIVEL = { inicial: 'bg-red-100 text-red-800', basico: 'bg-amber-100 text-amber-800', intermedio: 'bg-blue-100 text-blue-800', avanzado: 'bg-green-100 text-green-800', competitivo: 'bg-purple-100 text-purple-800' };
const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

function AdminProgreso() {
  useTituloPagina('Progreso Deportivo');
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historialData, setHistorialData] = useState([]);
  const [historialNombre, setHistorialNombre] = useState('');
  const [historialLoading, setHistorialLoading] = useState(false);

  const fetchResumen = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroTurno) params.turno = filtroTurno;
      if (filtroNivel) params.nivel = filtroNivel;
      const data = await getResumenProgreso(params);
      setResumen(data);
    } catch {
      setError('Error al cargar resumen de progreso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumen();
  }, [filtroTurno, filtroNivel]);

  const openHistorial = async (alumno) => {
    setHistorialNombre(alumno.alumno_nombre);
    setShowHistorialModal(true);
    setHistorialLoading(true);
    try {
      const data = await getHistorialProgreso(alumno.alumno_id);
      setHistorialData(data.historial || []);
    } catch {
      setHistorialData([]);
    } finally {
      setHistorialLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const alumnosFiltrados = (resumen?.alumnos || []).filter((a) => {
    if (!busqueda.trim()) return true;
    return (a.alumno_nombre || '').toLowerCase().includes(busqueda.trim().toLowerCase());
  });

  const getNivelBadge = (nivel) => {
    const color = COLORES_NIVEL[nivel] || 'bg-gray-100 text-[#172033]';
    const label = NOMBRES_NIVEL[nivel] || nivel;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
  };

  if (loading && !resumen) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <CabeceraPagina
        titulo="Seguimiento de Progreso"
        subtitulo="Evaluación deportiva de los alumnos por nivel y turno"
      />

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* ── Barra de filtros ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4 mb-5">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <div className="flex-1 min-w-[230px]">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Buscar alumno</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre del alumno..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Turno</label>
            <select value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500 ${filtroTurno ? 'border-invictus-400 text-invictus-700 font-medium' : 'border-gray-300'}`}>
              <option value="">Todos los turnos</option>
              {Object.entries(NOMBRES_TURNO).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Nivel deportivo</label>
            <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500 ${filtroNivel ? 'border-invictus-400 text-invictus-700 font-medium' : 'border-gray-300'}`}>
              <option value="">Todos los niveles</option>
              {NIVELES.filter(Boolean).map((n) => (
                <option key={n} value={n}>{NOMBRES_NIVEL[n]}</option>
              ))}
            </select>
          </div>
          {(busqueda || filtroTurno || filtroNivel) && (
            <button
              onClick={() => { setBusqueda(''); setFiltroTurno(''); setFiltroNivel(''); }}
              className="px-4 py-2 text-sm font-medium text-slate-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {resumen && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 border-l-emerald-600 p-4">
              <p className="text-xs text-slate-500 font-medium">Promedio General</p>
              <p className="text-2xl font-bold text-[#172033] mt-1">{resumen.promedio_general || '—'}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 border-l-blue-500 p-4">
              <p className="text-xs text-slate-500 font-medium">Total Evaluaciones</p>
              <p className="text-2xl font-bold text-[#172033] mt-1">{resumen.total_evaluaciones}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 border-l-violet-500 p-4">
              <p className="text-xs text-slate-500 font-medium">Alumnos Evaluados</p>
              <p className="text-2xl font-bold text-[#172033] mt-1">{resumen.total_alumnos_evaluados}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {NIVELES.filter(Boolean).map((n) => (
              <div key={n} className={`rounded-xl p-3 border ${COLORES_NIVEL[n].replace('text-', 'border-').replace('bg-', 'bg-')}`}>
                <p className="text-xs font-medium opacity-75">{NOMBRES_NIVEL[n]}</p>
                <p className="text-2xl font-bold mt-1">{resumen[`alumnos_${n}`] || 0}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4">
              <h3 className="font-semibold text-[#172033] mb-3 text-sm">Mejor Progreso</h3>
              {resumen.mejor_progreso?.length > 0 ? (
                <div className="space-y-2">
                  {resumen.mejor_progreso.map((a) => (
                    <div key={a.alumno_id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{a.alumno_nombre}</span>
                      <span className="font-semibold text-green-700">{a.promedio}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sin datos</p>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4">
              <h3 className="font-semibold text-[#172033] mb-3 text-sm">Requiere Atención</h3>
              {resumen.bajo_progreso?.length > 0 ? (
                <div className="space-y-2">
                  {resumen.bajo_progreso.map((a) => (
                    <div key={a.alumno_id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{a.alumno_nombre}</span>
                      <span className="font-semibold text-red-700">{a.promedio}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sin datos</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-[#172033] text-sm">Lista de Alumnos</h3>
              <span className="text-xs text-gray-400">{alumnosFiltrados.length} alumno{alumnosFiltrados.length !== 1 ? 's' : ''}</span>
            </div>
            {alumnosFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                      <th className="px-4 py-3 font-semibold">Nombre</th>
                      <th className="px-4 py-3 font-semibold">Turno</th>
                      <th className="px-4 py-3 font-semibold text-center">Nivel</th>
                      <th className="px-4 py-3 font-semibold text-center">Promedio</th>
                      <th className="px-4 py-3 font-semibold">Última Eval.</th>
                      <th className="px-4 py-3 font-semibold">Entrenador</th>
                      <th className="px-4 py-3 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosFiltrados.map((a) => (
                      <tr key={a.alumno_id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-[#172033]">{a.alumno_nombre}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{a.turno_asignado ? NOMBRES_TURNO[a.turno_asignado] || a.turno_asignado : '—'}</td>
                        <td className="px-4 py-3 text-center">{a.nivel ? getNivelBadge(a.nivel) : '—'}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{a.promedio || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{a.fecha_evaluacion ? formatDate(a.fecha_evaluacion) : '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{a.entrenador_nombre || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {a.alumno_id && (
                            <ActionButton tipo="historial" onClick={() => openHistorial(a)} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">{(busqueda || filtroTurno || filtroNivel) ? "No hay alumnos que coincidan con los filtros" : "No hay evaluaciones registradas"}</div>
            )}
          </div>
        </>
      )}

      {showHistorialModal && (
        <div className="fixed inset-0 bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Historial de Evaluaciones</h3>
                <p className="text-sm text-slate-500">{historialNombre}</p>
              </div>
              <button onClick={() => setShowHistorialModal(false)} className="text-gray-400 hover:text-slate-500 text-xl">&times;</button>
            </div>
            {historialLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
              </div>
            ) : historialData.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Sin evaluaciones registradas</div>
            ) : (
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-gray-100">
                      <th className="px-3 py-2 font-medium">Fecha</th>
                      <th className="px-3 py-2 font-medium text-center">Nivel</th>
                      <th className="px-3 py-2 font-medium text-center">Téc.</th>
                      <th className="px-3 py-2 font-medium text-center">Def.</th>
                      <th className="px-3 py-2 font-medium text-center">Res.</th>
                      <th className="px-3 py-2 font-medium text-center">Vel.</th>
                      <th className="px-3 py-2 font-medium text-center">Frz.</th>
                      <th className="px-3 py-2 font-medium text-center">Disc.</th>
                      <th className="px-3 py-2 font-medium text-center">Spar.</th>
                      <th className="px-3 py-2 font-medium text-center">Prom.</th>
                      <th className="px-3 py-2 font-medium">Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialData.map((h, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700">{formatDate(h.fecha_evaluacion)}</td>
                        <td className="px-3 py-2 text-center">{getNivelBadge(h.nivel)}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{h.tecnica ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{h.defensa ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{h.resistencia ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{h.velocidad ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{h.fuerza ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{h.disciplina ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{h.sparring ?? '—'}</td>
                        <td className="px-3 py-2 text-center font-semibold text-gray-700">{h.promedio ?? '—'}</td>
                        <td className="px-3 py-2 text-slate-500 max-w-[120px] truncate" title={h.observacion}>{h.observacion || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => setShowHistorialModal(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-[#172033] border border-gray-300 rounded-lg">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProgreso;
