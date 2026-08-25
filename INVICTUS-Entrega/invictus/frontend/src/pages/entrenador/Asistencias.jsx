import { useState, useEffect, useCallback } from 'react';
import { getAsistencias, createAsistencia, updateAsistencia, deleteAsistencia } from '../../services/asistenciaService';
import { getMisAlumnosEntrenador, getMisHorariosEntrenador } from '../../services/entrenadorService';

const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ESTADOS = [
  { key: '', label: '—', color: 'bg-gray-50 border-gray-200 text-gray-400', icon: '—' },
  { key: 'presente', label: 'Presente', color: 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200', icon: '✅' },
  { key: 'falta', label: 'Falta', color: 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200', icon: '❌' },
  { key: 'tardanza', label: 'Tardanza', color: 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200', icon: '⏰' },
  { key: 'justificado', label: 'Justificado', color: 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200', icon: '🟦' },
];

function getHoy() {
  return new Date().toISOString().slice(0, 10);
}

function isFutureDate(fechaStr) {
  return fechaStr > getHoy();
}

function getLunes(fecha) {
  const d = new Date(fecha + 'T12:00:00');
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getDiasSemana(lunesStr) {
  const hoy = getHoy();
  const dias = [];
  const base = new Date(lunesStr + 'T12:00:00');
  for (let i = 0; i < 5; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const fechaStr = d.toISOString().slice(0, 10);
    dias.push({
      fecha: fechaStr,
      nombreCorto: DIAS_CORTO[d.getDay()],
      numero: d.getDate(),
      mes: MESES[d.getMonth()],
      esHoy: fechaStr === hoy,
      esFuturo: fechaStr > hoy,
    });
  }
  return dias;
}

function getDiasMes(anio, mes) {
  const hoy = getHoy();
  const dias = [];
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  for (let i = 1; i <= totalDias; i++) {
    const d = new Date(anio, mes, i);
    const diaSemana = d.getDay();
    if (diaSemana >= 1 && diaSemana <= 5) {
      const fechaStr = d.toISOString().slice(0, 10);
      dias.push({
        fecha: fechaStr,
        nombreCorto: DIAS_CORTO[diaSemana],
        numero: i,
        mes: MESES[mes],
        semana: Math.ceil(i / 7),
        esHoy: fechaStr === hoy,
        esFuturo: fechaStr > hoy,
      });
    }
  }
  return dias;
}

function getEstadoObj(key) {
  return ESTADOS.find(e => e.key === key) || ESTADOS[0];
}

function getProxEstado(current) {
  const idx = ESTADOS.findIndex(e => e.key === current);
  return ESTADOS[(idx + 1) % ESTADOS.length].key;
}

function formatearFechaCorta(fechaStr) {
  const d = new Date(fechaStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function getMensajeError(error) {
  if (error?.response?.data?.msg) return error.response.data.msg;
  if (error?.response?.status === 401) return 'Sesión expirada. Inicie sesión nuevamente.';
  if (error?.response?.status === 403) return 'No tiene permisos para realizar esta acción.';
  if (error?.response?.status === 404) return 'Registro no encontrado.';
  if (error?.response?.status === 400) return error.response.data?.msg || 'Datos inválidos.';
  if (error?.message) return error.message;
  return 'Error al conectar con el servidor';
}

function Asistencias() {
  const [alumnos, setAlumnos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [turnosUnicos, setTurnosUnicos] = useState([]);
  const [filtroTurno, setFiltroTurno] = useState('');
  const [vista, setVista] = useState('semana');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [grid, setGrid] = useState({});
  const [asistenciasMap, setAsistenciasMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usuario, setUsuario] = useState(null);

  const lunesActual = getLunes(fechaActual.toISOString().slice(0, 10));
  const diasSemana = getDiasSemana(lunesActual);
  const mesActual = fechaActual.getMonth();
  const anioActual = fechaActual.getFullYear();
  const diasMes = vista === 'mes' ? getDiasMes(anioActual, mesActual) : diasSemana;

  const fechaInicio = vista === 'semana' ? lunesActual : `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-01`;
  const fechaFin = vista === 'semana'
    ? (() => { const d = new Date(lunesActual + 'T12:00:00'); d.setDate(d.getDate() + 4); return d.toISOString().slice(0, 10); })()
    : `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${new Date(anioActual, mesActual + 1, 0).getDate()}`;

  const textoPeriodo = vista === 'semana'
    ? `${formatearFechaCorta(lunesActual)} – ${formatearFechaCorta(diasSemana[4]?.fecha || lunesActual)}`
    : `${MESES[mesActual]} ${anioActual}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alumnosData, horariosData] = await Promise.all([
        getMisAlumnosEntrenador(),
        getMisHorariosEntrenador(),
      ]);
      setAlumnos(alumnosData.alumnos || []);
      setHorarios(horariosData.horarios || []);
      const turnos = [...new Set((horariosData.horarios || []).filter(h => h.turno).map(h => h.turno))];
      setTurnosUnicos(turnos);

      try {
        const stored = localStorage.getItem('usuario');
        if (stored) setUsuario(JSON.parse(stored));
      } catch {}
    } catch (err) {
      setError(getMensajeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAsistencias = useCallback(async () => {
    try {
      const data = await getAsistencias({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      const asistencias = data.asistencias || [];
      const nuevoGrid = {};
      const nuevoMap = {};
      asistencias.forEach(a => {
        const fechaKey = a.fecha.slice(0, 10);
        if (!nuevoGrid[a.alumno_id]) nuevoGrid[a.alumno_id] = {};
        nuevoGrid[a.alumno_id][fechaKey] = a.estado;
        nuevoMap[`${a.alumno_id}_${fechaKey}`] = a;
      });
      setGrid(nuevoGrid);
      setAsistenciasMap(nuevoMap);
    } catch (err) {
      setError(getMensajeError(err));
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchAsistencias(); }, [fetchAsistencias]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const alumnosFiltrados = filtroTurno
    ? alumnos.filter(a => (a.turno_asignado || a.turno || a.turno_horario) === filtroTurno)
    : alumnos;

  const toggleCelda = async (alumnoId, fecha) => {
    if (isFutureDate(fecha)) return;

    const estadoActual = grid[alumnoId]?.[fecha] || '';
    const nuevoEstado = getProxEstado(estadoActual);

    setGrid(prev => ({
      ...prev,
      [alumnoId]: { ...(prev[alumnoId] || {}), [fecha]: nuevoEstado }
    }));

    const existente = asistenciasMap[`${alumnoId}_${fecha}`];
    try {
      if (nuevoEstado === '' && existente) {
        await deleteAsistencia(existente.id_asistencia);
      } else if (nuevoEstado !== '' && existente) {
        await updateAsistencia(existente.id_asistencia, { estado: nuevoEstado });
      } else if (nuevoEstado !== '' && !existente) {
        await createAsistencia({ alumno_id: alumnoId, fecha, estado: nuevoEstado });
      }
      const refreshed = await getAsistencias({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      const asistencias = refreshed.asistencias || [];
      const nuevoMap = {};
      asistencias.forEach(a => {
        nuevoMap[`${a.alumno_id}_${a.fecha.slice(0, 10)}`] = a;
      });
      setAsistenciasMap(nuevoMap);
    } catch (err) {
      setGrid(prev => ({
        ...prev,
        [alumnoId]: { ...(prev[alumnoId] || {}), [fecha]: estadoActual }
      }));
      setError(getMensajeError(err));
    }
  };

  const guardarTodo = async () => {
    setGuardando(true);
    setError('');
    try {
      let guardados = 0;
      let errores = 0;
      for (const alumno of alumnosFiltrados) {
        const alumnoId = alumno.alumno_id || alumno.id_usuario;
        for (const dia of diasMes) {
          if (dia.esFuturo) continue;
          const estado = grid[alumnoId]?.[dia.fecha];
          const existente = asistenciasMap[`${alumnoId}_${dia.fecha}`];
          try {
            if (estado) {
              if (existente) {
                if (existente.estado !== estado) {
                  await updateAsistencia(existente.id_asistencia, { estado });
                  guardados++;
                }
              } else {
                await createAsistencia({ alumno_id: alumnoId, fecha: dia.fecha, estado });
                guardados++;
              }
            } else if (!estado && existente) {
              await deleteAsistencia(existente.id_asistencia);
              guardados++;
            }
          } catch {
            errores++;
          }
        }
      }
      await fetchAsistencias();
      if (errores > 0) {
        setError(`${errores} registro(s) no pudieron guardarse`);
      }
      setSuccess(guardados > 0 ? `${guardados} cambio(s) guardado(s)` : 'No hay cambios nuevos');
    } catch (err) {
      setError(getMensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const getResumenAlumno = (alumnoId) => {
    const estados = grid[alumnoId] || {};
    let presentes = 0, faltas = 0, tardanzas = 0, justificados = 0, total = 0;
    diasMes.forEach(d => {
      if (d.esFuturo) return;
      const e = estados[d.fecha];
      if (e) {
        total++;
        if (e === 'presente') presentes++;
        else if (e === 'falta') faltas++;
        else if (e === 'tardanza') tardanzas++;
        else if (e === 'justificado') justificados++;
      }
    });
    const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;
    return { presentes, faltas, tardanzas, justificados, total, porcentaje };
  };

  const getResumenGrupo = () => {
    let totalAlumnos = 0, presentes = 0, faltas = 0, tardanzas = 0, justificados = 0, registros = 0;
    alumnosFiltrados.forEach(a => {
      totalAlumnos++;
      const r = getResumenAlumno(a.alumno_id || a.id_usuario);
      presentes += r.presentes;
      faltas += r.faltas;
      tardanzas += r.tardanzas;
      justificados += r.justificados;
      registros += r.total;
    });
    const porcentaje = registros > 0 ? Math.round((presentes / registros) * 100) : 0;
    return { totalAlumnos, presentes, faltas, tardanzas, justificados, porcentaje };
  };

  const periodoAnterior = () => {
    const d = new Date(fechaActual);
    if (vista === 'semana') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setFechaActual(d);
  };

  const periodoSiguiente = () => {
    const d = new Date(fechaActual);
    if (vista === 'semana') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setFechaActual(d);
  };

  const irHoy = () => setFechaActual(new Date());

  const resumenGrupo = getResumenGrupo();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#172033]">Asistencia de Entrenamiento</h2>
          <p className="text-slate-500 mt-1">
            {usuario ? `${usuario.nombre || ''} — ` : ''}
            Planilla de control de asistencias
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <span>✅</span> {success}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Turno</label>
              <select
                value={filtroTurno}
                onChange={(e) => setFiltroTurno(e.target.value)}
                className="block w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-invictus-500 focus:border-invictus-500"
              >
                <option value="">Todos mis turnos</option>
                {turnosUnicos.map(t => (
                  <option key={t} value={t}>{NOMBRES_TURNO[t] || t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vista</label>
              <div className="flex mt-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setVista('semana')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    vista === 'semana'
                      ? 'bg-white shadow text-invictus-700'
                      : 'text-slate-500 hover:text-gray-700'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setVista('mes')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    vista === 'mes'
                      ? 'bg-white shadow text-invictus-700'
                      : 'text-slate-500 hover:text-gray-700'
                  }`}
                >
                  Mes
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Período</label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={periodoAnterior}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-slate-500"
                >
                  ←
                </button>
                <span className="text-sm font-semibold text-gray-700 min-w-[180px] text-center">
                  {textoPeriodo}
                </span>
                <button
                  onClick={periodoSiguiente}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-slate-500"
                >
                  →
                </button>
                <button
                  onClick={irHoy}
                  className="px-3 py-1.5 text-xs font-medium bg-invictus-50 text-invictus-700 rounded-lg hover:bg-invictus-100 border border-invictus-200"
                >
                  Hoy
                </button>
              </div>
            </div>

            <div className="ml-auto">
              <button
                onClick={guardarTodo}
                disabled={guardando}
                className="flex items-center gap-2 px-4 py-2 bg-invictus-600 text-white rounded-lg text-sm font-medium hover:bg-invictus-700 disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>💾 Guardar todo</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-lg">👥</div>
              <div>
                <p className="text-2xl font-bold text-[#172033]">{resumenGrupo.totalAlumnos}</p>
                <p className="text-xs text-slate-500">Alumnos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-lg">✅</div>
              <div>
                <p className="text-2xl font-bold text-green-600">{resumenGrupo.presentes}</p>
                <p className="text-xs text-slate-500">Presentes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-lg">❌</div>
              <div>
                <p className="text-2xl font-bold text-red-600">{resumenGrupo.faltas}</p>
                <p className="text-xs text-slate-500">Faltas</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center text-lg">⏰</div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{resumenGrupo.tardanzas}</p>
                <p className="text-xs text-slate-500">Tardanzas</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-lg">📈</div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{resumenGrupo.porcentaje}%</p>
                <p className="text-xs text-slate-500">% Asistencia</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-500 font-medium">Leyenda:</span>
          {ESTADOS.filter(e => e.key).map(e => (
            <span key={e.key} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${e.color} font-medium`}>
              {e.icon} {e.label}
            </span>
          ))}
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">Clic para cambiar estado</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400 inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-gray-200 opacity-50"></span> Fecha futura (bloqueada)
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin mb-4" />
              <p className="text-sm text-slate-500">Cargando planilla...</p>
            </div>
          ) : alumnosFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-slate-500 font-medium">No hay alumnos asignados</p>
              <p className="text-sm text-gray-400 mt-1">
                {filtroTurno ? `No hay alumnos en el turno ${NOMBRES_TURNO[filtroTurno] || filtroTurno}` : 'No tienes alumnos asignados aún'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[180px] border-r border-gray-200">
                      Alumno
                    </th>
                    {diasMes.map(dia => (
                      <th
                        key={dia.fecha}
                        className={`px-2 py-3 text-center min-w-[72px] border-r border-gray-100 ${
                          dia.esHoy ? 'bg-invictus-50' : dia.esFuturo ? 'bg-gray-100' : ''
                        }`}
                      >
                        <div className={`text-xs font-semibold ${dia.esHoy ? 'text-invictus-700' : dia.esFuturo ? 'text-gray-400' : 'text-slate-500'}`}>
                          {dia.nombreCorto}
                        </div>
                        <div className={`text-lg font-bold ${dia.esHoy ? 'text-invictus-600' : dia.esFuturo ? 'text-gray-400' : 'text-[#172033]'}`}>
                          {dia.numero}
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase bg-gray-100 border-r border-gray-200 min-w-[50px]">
                      P
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase bg-gray-100 border-r border-gray-200 min-w-[50px]">
                      %
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase bg-gray-100 border-r border-gray-200 min-w-[50px]">
                      F
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase bg-gray-100 min-w-[50px]">
                      T
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosFiltrados.map((alumno, idx) => {
                    const alumnoId = alumno.alumno_id || alumno.id_usuario;
                    const resumen = getResumenAlumno(alumnoId);
                    return (
                      <tr
                        key={alumnoId}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5 border-r border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-invictus-100 text-invictus-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {(alumno.alumno_nombre || alumno.nombre || '??').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#172033] truncate">
                                {alumno.alumno_nombre || alumno.nombre || '—'}
                              </p>
                              {alumno.turno_asignado && (
                                <p className="text-xs text-gray-400">
                                  {NOMBRES_TURNO[alumno.turno_asignado] || alumno.turno_asignado}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        {diasMes.map(dia => {
                          const estado = grid[alumnoId]?.[dia.fecha] || '';
                          const estadoObj = getEstadoObj(estado);
                          const bloqueado = dia.esFuturo;
                          return (
                            <td
                              key={dia.fecha}
                              className={`px-1 py-1 text-center border-r border-gray-100 ${
                                dia.esHoy ? 'bg-invictus-50/50' : ''
                              }`}
                            >
                              {bloqueado ? (
                                <div
                                  className="w-11 h-11 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-400 text-lg font-bold flex items-center justify-center opacity-40 cursor-not-allowed"
                                  title="Fecha futura — no disponible"
                                >
                                  🔒
                                </div>
                              ) : (
                                <button
                                  onClick={() => toggleCelda(alumnoId, dia.fecha)}
                                  title={`${alumno.alumno_nombre || 'Alumno'} — ${dia.nombreCorto} ${dia.numero}\nEstado: ${estadoObj.label}\nClic para cambiar`}
                                  className={`w-11 h-11 rounded-lg border-2 text-lg font-bold transition-all duration-150 cursor-pointer ${
                                    estadoObj.color
                                  }`}
                                >
                                  {estadoObj.icon}
                                </button>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2.5 text-center bg-gray-100 border-r border-gray-200">
                          <span className="text-sm font-bold text-green-700">{resumen.presentes}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center bg-gray-100 border-r border-gray-200">
                          <span className={`text-sm font-bold ${
                            resumen.porcentaje >= 80 ? 'text-green-700' :
                            resumen.porcentaje >= 60 ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            {resumen.porcentaje}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center bg-gray-100 border-r border-gray-200">
                          <span className="text-sm font-bold text-red-600">{resumen.faltas}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center bg-gray-100">
                          <span className="text-sm font-bold text-yellow-600">{resumen.tardanzas}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                    <td className="sticky left-0 z-10 bg-gray-100 px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      Total grupo
                    </td>
                    {diasMes.map(dia => {
                      if (dia.esFuturo) {
                        return (
                          <td key={dia.fecha} className="px-2 py-3 text-center text-xs text-gray-400 border-r border-gray-100">
                            🔒
                          </td>
                        );
                      }
                      let count = 0;
                      alumnosFiltrados.forEach(a => {
                        const aid = a.alumno_id || a.id_usuario;
                        if (grid[aid]?.[dia.fecha]) count++;
                      });
                      return (
                        <td key={dia.fecha} className="px-2 py-3 text-center text-xs text-slate-500 border-r border-gray-100">
                          {count > 0 ? count : '—'}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center text-sm text-green-700 border-r border-gray-200">{resumenGrupo.presentes}</td>
                    <td className="px-3 py-3 text-center text-sm text-purple-700 border-r border-gray-200">{resumenGrupo.porcentaje}%</td>
                    <td className="px-3 py-3 text-center text-sm text-red-700 border-r border-gray-200">{resumenGrupo.faltas}</td>
                    <td className="px-3 py-3 text-center text-sm text-yellow-700">{resumenGrupo.tardanzas}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-gray-400">
          Haz clic en una celda para cambiar el estado: vacío → ✅ Presente → ❌ Falta → ⏰ Tardanza → 🟦 Justificado → vacío
        </div>
      </div>
    </div>
  );
}

export default Asistencias;
