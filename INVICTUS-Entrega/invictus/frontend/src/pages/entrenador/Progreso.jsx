import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTituloPagina } from '../../hooks/useTituloPagina';
import {
  getListaAlumnos,
  getProgreso,
  createProgreso,
  updateProgreso,
} from '../../services/progresoService';
import CabeceraPagina from '../../components/CabeceraPagina';
import Paginacion from '../../components/Paginacion';
import EvaluacionForm from '../../components/progreso/EvaluacionForm';
import PerfilProgreso from '../../components/progreso/PerfilProgreso';
import HistorialEvaluaciones from '../../components/progreso/HistorialEvaluaciones';
import {
  NOMBRES_NIVEL_DEPORTIVO,
  COLORES_NIVEL_DEPORTIVO,
  ESTADOS_PROGRESO,
  NOMBRES_TURNO,
  calcularEstadoProgreso,
  formatearFecha,
} from '../../utils/progresoUtils';

function EntrenadorProgreso() {
  useTituloPagina('Evaluación Deportiva');
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  const [formModal, setFormModal] = useState(null);
  const [perfilModal, setPerfilModal] = useState(null);
  const [historialModal, setHistorialModal] = useState(null);

  const fetchAlumnos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (busqueda.trim()) params.busqueda = busqueda.trim();
      if (filtroTurno) params.turno = filtroTurno;
      const data = await getListaAlumnos(params);
      setAlumnos(data.alumnos || []);
    } catch {
      setError('Error al cargar tus alumnos');
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  }, [busqueda, filtroTurno]);

  useEffect(() => {
    const timer = setTimeout(() => fetchAlumnos(), busqueda ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchAlumnos, busqueda]);

  const alumnosFiltrados = useMemo(() => {
    const desde = (pagina - 1) * porPagina;
    return alumnos.slice(desde, desde + porPagina);
  }, [alumnos, pagina, porPagina]);

  const manejarAccion = async (accion, alumno) => {
    if (accion === 'ver') setPerfilModal(alumno);
    if (accion === 'registrar') setFormModal({ modo: 'create', alumno });
    if (accion === 'historial') setHistorialModal(alumno);
    if (accion === 'editarUltima') {
      try {
        const data = await getProgreso(alumno.progreso_id);
        setFormModal({ modo: 'editar', alumno, evaluacion: data.progreso });
      } catch {
        setError('No se pudo cargar la evaluación');
      }
    }
  };

  const onGuardado = async (payload, tipo, id) => {
    try {
      if (tipo === 'edit') {
        await updateProgreso(id, payload);
        setExitoMsg('Evaluación actualizada correctamente');
      } else {
        await createProgreso(payload);
        setExitoMsg('Evaluación registrada correctamente');
      }
    } catch (err) {
      throw new Error(err.response?.data?.msg || 'Error al guardar');
    }
  };

  const hayFiltros = busqueda || filtroTurno;

  return (
    <div>
      <CabeceraPagina
        titulo="Evaluación Deportiva"
        subtitulo="Registra y consulta el progreso de tus alumnos"
      />

      {exitoMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex justify-between items-center">
          <span>{exitoMsg}</span>
          <button onClick={() => setExitoMsg('')} className="text-green-700 hover:text-green-900">&times;</button>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">&times;</button>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 p-4 mb-5">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <div className="flex-1 min-w-[230px]">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Buscar alumno</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              placeholder="Buscar por nombre o documento..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Turno</label>
            <select value={filtroTurno} onChange={(e) => { setFiltroTurno(e.target.value); setPagina(1); }}
              className={`border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-invictus-500 ${filtroTurno ? 'border-invictus-400 text-invictus-700 font-medium' : 'border-gray-300'}`}>
              <option value="">Todos los turnos</option>
              {Object.entries(NOMBRES_TURNO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {hayFiltros && (
            <button onClick={() => { setBusqueda(''); setFiltroTurno(''); setPagina(1); }}
              className="px-4 py-2 text-sm font-medium text-slate-500 bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-[#172033] text-sm">Mis Alumnos</h3>
          <span className="text-xs text-gray-400">{alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : alumnos.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            {hayFiltros ? 'No se encontraron alumnos con los filtros aplicados' : 'No tienes alumnos asignados'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                    <th className="px-3 py-3 font-semibold">Alumno</th>
                    <th className="px-3 py-3 font-semibold">Nivel</th>
                    <th className="px-3 py-3 font-semibold">Turno</th>
                    <th className="px-3 py-3 font-semibold text-center">Peso</th>
                    <th className="px-3 py-3 font-semibold">Progreso</th>
                    <th className="px-3 py-3 font-semibold">Última eval.</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosFiltrados.map((a) => {
                    const estado = calcularEstadoProgreso(a.porcentaje_progreso, a.porcentaje_anterior);
                    return (
                      <tr key={a.alumno_id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-invictus-100 text-invictus-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {(a.alumno_nombre || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#172033] truncate">{a.alumno_nombre}</p>
                              <p className="text-xs text-slate-400">CI: {a.alumno_ci || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COLORES_NIVEL_DEPORTIVO[a.nivel_deportivo] || 'bg-gray-100 text-gray-700'}`}>
                            {NOMBRES_NIVEL_DEPORTIVO[a.nivel_deportivo] || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600">{a.turno_asignado ? NOMBRES_TURNO[a.turno_asignado] || a.turno_asignado : '—'}</td>
                        <td className="px-3 py-3 text-center text-sm text-slate-600">{a.ultimo_peso ?? a.peso_actual ?? '—'} kg</td>
                        <td className="px-3 py-3">
                          <div className="min-w-[90px]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-[#172033]">{a.porcentaje_progreso != null ? `${a.porcentaje_progreso}%` : '—'}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-invictus-600 rounded-full" style={{ width: `${Math.min(a.porcentaje_progreso ?? 0, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{a.ultima_evaluacion ? formatearFecha(a.ultima_evaluacion) : '—'}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADOS_PROGRESO[estado]?.color || 'bg-gray-100 text-gray-600'}`}>{estado}</span>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => manejarAccion('ver', a)} title="Ver progreso"
                              className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button onClick={() => manejarAccion('registrar', a)} title="Registrar evaluación"
                              className="p-1.5 rounded-lg text-invictus-700 bg-invictus-50 hover:bg-invictus-100">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </button>
                            {a.progreso_id && (
                              <button onClick={() => manejarAccion('editarUltima', a)} title="Editar última evaluación"
                                className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                            )}
                            <button onClick={() => manejarAccion('historial', a)} title="Ver historial"
                              className="p-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {alumnos.length > porPagina && (
              <Paginacion total={alumnos.length} pagina={pagina} porPagina={porPagina} setPagina={setPagina} setPorPagina={setPorPagina} />
            )}
          </>
        )}
      </div>

      {formModal && (
        <EvaluacionForm
          open={!!formModal}
          onClose={() => setFormModal(null)}
          alumno={formModal.alumno}
          evaluacion={formModal.modo === 'editar' ? formModal.evaluacion : null}
          tipo={formModal.modo}
          onGuardado={async (payload, tipo, id) => {
            await onGuardado(payload, tipo, id);
            fetchAlumnos();
          }}
        />
      )}

      {perfilModal && (
        <PerfilProgreso
          alumnoId={perfilModal.alumno_id}
          onClose={() => setPerfilModal(null)}
          onRegistrarEvaluacion={() => {
            const al = perfilModal;
            setPerfilModal(null);
            setFormModal({ modo: 'create', alumno: al });
          }}
        />
      )}

      {historialModal && (
        <HistorialEvaluaciones
          alumnoId={historialModal.alumno_id}
          alumnoNombre={historialModal.alumno_nombre}
          onClose={() => setHistorialModal(null)}
          onEvaluacionEliminada={fetchAlumnos}
          onEditar={(evaluacion) => {
            const al = historialModal;
            setHistorialModal(null);
            setFormModal({ modo: 'editar', alumno: al, evaluacion });
          }}
        />
      )}
    </div>
  );
}

export default EntrenadorProgreso;
