import { useState, useEffect } from 'react';
import { getResumenProgreso, getHistorialProgreso } from '../../services/progresoService';

const NIVELES = ['', 'inicial', 'basico', 'intermedio', 'avanzado', 'competitivo'];
const NOMBRES_NIVEL = { inicial: 'Inicial', basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado', competitivo: 'Competitivo' };
const COLORES_NIVEL = { inicial: 'bg-red-100 text-red-800', basico: 'bg-amber-100 text-amber-800', intermedio: 'bg-blue-100 text-blue-800', avanzado: 'bg-green-100 text-green-800', competitivo: 'bg-purple-100 text-purple-800' };
const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

function AdminProgreso() {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');

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

  const getNivelBadge = (nivel) => {
    const color = COLORES_NIVEL[nivel] || 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Seguimiento de Progreso</h2>
          <p className="text-gray-500 mt-1">Evaluación deportiva de alumnos</p>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500 font-medium mr-1">Filtrar:</span>
        {['', 'manana', 'tarde', 'noche'].map((tur) => (
          <button
            key={tur}
            onClick={() => setFiltroTurno(tur)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${filtroTurno === tur ? 'bg-invictus-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {tur ? NOMBRES_TURNO[tur] : 'Todos'}
          </button>
        ))}
        <span className="text-sm text-gray-300 mx-1">|</span>
        {NIVELES.map((n) => (
          <button
            key={n}
            onClick={() => setFiltroNivel(n)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${filtroNivel === n ? 'bg-invictus-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {n ? NOMBRES_NIVEL[n] : 'Todos'}
          </button>
        ))}
      </div>

      {resumen && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">Promedio General</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{resumen.promedio_general || '—'}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">Total Evaluaciones</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{resumen.total_evaluaciones}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">Alumnos Evaluados</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{resumen.total_alumnos_evaluados}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {NIVELES.filter(Boolean).map((n) => (
              <div key={n} className={`rounded-xl p-3 border ${COLORES_NIVEL[n].replace('text-', 'border-').replace('bg-', 'bg-')}`}>
                <p className="text-xs font-medium opacity-75">{NOMBRES_NIVEL[n]}</p>
                <p className="text-xl font-bold mt-1">{resumen[`alumnos_${n}`] || 0}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Mejor Progreso</h3>
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
                <p className="text-sm text-gray-500">Sin datos</p>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Requiere Atención</h3>
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
                <p className="text-sm text-gray-500">Sin datos</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Lista de Alumnos</h3>
            </div>
            {resumen.alumnos?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                      <th className="px-4 py-3 font-medium">Nombre</th>
                      <th className="px-4 py-3 font-medium">Turno</th>
                      <th className="px-4 py-3 font-medium text-center">Nivel</th>
                      <th className="px-4 py-3 font-medium text-center">Promedio</th>
                      <th className="px-4 py-3 font-medium">Última Eval.</th>
                      <th className="px-4 py-3 font-medium">Entrenador</th>
                      <th className="px-4 py-3 font-medium text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.alumnos.map((a) => (
                      <tr key={a.alumno_id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{a.alumno_nombre}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{a.turno_asignado ? NOMBRES_TURNO[a.turno_asignado] || a.turno_asignado : '—'}</td>
                        <td className="px-4 py-3 text-center">{a.nivel ? getNivelBadge(a.nivel) : '—'}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{a.promedio || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{a.fecha_evaluacion ? formatDate(a.fecha_evaluacion) : '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{a.entrenador_nombre || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {a.alumno_id && (
                            <button
                              onClick={() => openHistorial(a)}
                              className="text-invictus-600 hover:text-invictus-800 text-sm font-medium"
                            >
                              Ver historial
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No hay alumnos registrados</div>
            )}
          </div>
        </>
      )}

      {showHistorialModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Historial de Evaluaciones</h3>
                <p className="text-sm text-gray-500">{historialNombre}</p>
              </div>
              <button onClick={() => setShowHistorialModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            {historialLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
              </div>
            ) : historialData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Sin evaluaciones registradas</div>
            ) : (
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
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
                        <td className="px-3 py-2 text-center text-gray-600">{h.tecnica ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{h.defensa ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{h.resistencia ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{h.velocidad ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{h.fuerza ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{h.disciplina ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{h.sparring ?? '—'}</td>
                        <td className="px-3 py-2 text-center font-semibold text-gray-700">{h.promedio ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate" title={h.observacion}>{h.observacion || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => setShowHistorialModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">
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
