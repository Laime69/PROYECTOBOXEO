import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getAsistencias, createAsistencia, updateAsistencia, deleteAsistencia } from '../services/asistenciaService';
import ReportPDFPreview from './ReportPDFPreview';

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
const ESTADO_CODIGOS = { presente: 'P', falta: 'F', tardanza: 'T', justificado: 'J' };

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

function PlanillaAsistencia({
  alumnos = [],
  turnosUnicos = [],
  editable = true,
  titulo = 'Asistencia de Entrenamiento',
  subtitulo = 'Planilla de control de asistencias',
}) {
  const [filtroTurno, setFiltroTurno] = useState('');
  const [vista, setVista] = useState('semana');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [grid, setGrid] = useState({});
  const [asistenciasMap, setAsistenciasMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [obsCelda, setObsCelda] = useState(null);
  const [obsTexto, setObsTexto] = useState('');
  const [guardandoObs, setGuardandoObs] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [autocompleteAbierto, setAutocompleteAbierto] = useState(false);
  const [autocompleteIdx, setAutocompleteIdx] = useState(0);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const busquedaRef = useRef(null);
  const sugerenciasRef = useRef(null);
  const obsRef = useRef(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [docPreview, setDocPreview] = useState(null);

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

  const fetchAsistencias = useCallback(async () => {
    setLoading(true);
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

  useEffect(() => { fetchAsistencias(); }, [fetchAsistencias]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const getTextoAlumno = (a) => `${a.alumno_nombre || a.nombre || ''} ${a.alumno_correo || a.correo || ''} ${a.ci || ''}`;

  const sugerencias = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return alumnos
      .filter((a) => getTextoAlumno(a).toLowerCase().includes(q))
      .slice(0, 8);
  }, [alumnos, busqueda]);

  const seleccionarAlumno = (alumno) => {
    setBusqueda(alumno.alumno_nombre || alumno.nombre || '');
    setAlumnoSeleccionado(alumno);
    setAutocompleteAbierto(false);
    setAutocompleteIdx(0);
  };

  useEffect(() => {
    const manejarClick = (e) => {
      const enInput = busquedaRef.current?.contains(e.target);
      const enSugerencias = sugerenciasRef.current?.contains(e.target);
      if (!enInput && !enSugerencias) setAutocompleteAbierto(false);
    };
    document.addEventListener('mousedown', manejarClick);
    return () => document.removeEventListener('mousedown', manejarClick);
  }, []);

  const manejarTeclaBusqueda = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!autocompleteAbierto) {
        setAutocompleteAbierto(true);
        return;
      }
      setAutocompleteIdx((i) => Math.min(i + 1, sugerencias.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocompleteIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (autocompleteAbierto && sugerencias[autocompleteIdx]) {
        e.preventDefault();
        seleccionarAlumno(sugerencias[autocompleteIdx]);
      } else {
        setAutocompleteAbierto(false);
      }
    } else if (e.key === 'Escape') {
      setAutocompleteAbierto(false);
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setAlumnoSeleccionado(null);
    setAutocompleteAbierto(false);
  };

  const alumnosFiltrados = useMemo(() => {
    let list = filtroTurno
      ? alumnos.filter((a) => (a.turno_asignado || a.turno || a.turno_horario) === filtroTurno)
      : alumnos;
    const q = busqueda.trim().toLowerCase();
    if (alumnoSeleccionado) {
      const id = alumnoSeleccionado.alumno_id || alumnoSeleccionado.id_usuario;
      list = list.filter((a) => (a.alumno_id || a.id_usuario) === id);
    } else if (q) {
      list = list.filter((a) => getTextoAlumno(a).toLowerCase().includes(q));
    }
    return list;
  }, [alumnos, busqueda, filtroTurno, alumnoSeleccionado]);

  const toggleCelda = async (alumnoId, fecha) => {
    if (!editable || isFutureDate(fecha)) return;

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

  const guardarObservacion = async () => {
    if (!obsCelda || !editable) return;
    setGuardandoObs(true);
    try {
      await updateAsistencia(obsCelda.id, { observacion: obsTexto.trim() || null });
      setObsCelda(null);
      const refreshed = await getAsistencias({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      const asistencias = refreshed.asistencias || [];
      const nuevoMap = {};
      asistencias.forEach(a => {
        nuevoMap[`${a.alumno_id}_${a.fecha.slice(0, 10)}`] = a;
      });
      setAsistenciasMap(nuevoMap);
    } catch (err) {
      setError(getMensajeError(err));
    } finally {
      setGuardandoObs(false);
    }
  };

  useEffect(() => {
    const manejarClick = (e) => {
      if (obsRef.current && !obsRef.current.contains(e.target)) setObsCelda(null);
    };
    document.addEventListener('mousedown', manejarClick);
    return () => document.removeEventListener('mousedown', manejarClick);
  }, []);

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

  const getSemanaISO = (fechaStr) => {
    const d = new Date(fechaStr + 'T12:00:00');
    const jueves = new Date(d);
    jueves.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
    const inicioAnio = new Date(jueves.getFullYear(), 0, 4);
    inicioAnio.setDate(inicioAnio.getDate() - ((inicioAnio.getDay() + 6) % 7) + 3);
    const semana = 1 + Math.round((jueves - inicioAnio) / (7 * 24 * 3600 * 1000));
    return `${jueves.getFullYear()}-W${semana}`;
  };

  const agruparPorSemana = (dias) => {
    const grupos = [];
    let actual = null;
    dias.forEach((dia) => {
      const clave = getSemanaISO(dia.fecha);
      if (!actual || actual.clave !== clave) {
        actual = { clave, dias: [] };
        grupos.push(actual);
      }
      actual.dias.push(dia);
    });
    return grupos;
  };

  const getResumenDias = (alumnoId, dias) => {
    let presentes = 0, faltas = 0, tardanzas = 0, justificados = 0;
    dias.forEach((dia) => {
      const e = grid[alumnoId]?.[dia.fecha];
      if (e === 'presente') presentes++;
      else if (e === 'falta') faltas++;
      else if (e === 'tardanza') tardanzas++;
      else if (e === 'justificado') justificados++;
    });
    const total = presentes + faltas + tardanzas + justificados;
    const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;
    return { presentes, faltas, tardanzas, justificados, porcentaje };
  };

  const construirFila = (alumno, i, dias) => {
    const alumnoId = alumno.alumno_id || alumno.id_usuario;
    const r = getResumenDias(alumnoId, dias);
    const turnoTexto = alumno.turno_asignado || alumno.turno || alumno.turno_horario;
    return [
      i + 1,
      alumno.alumno_nombre || alumno.nombre || '—',
      turnoTexto ? NOMBRES_TURNO[turnoTexto] || turnoTexto : '—',
      ...dias.map((dia) => ESTADO_CODIGOS[grid[alumnoId]?.[dia.fecha]] || '—'),
      r.presentes,
      `${r.porcentaje}%`,
      r.faltas,
      r.tardanzas,
    ];
  };

  const construirTotal = (dias) => {
    let presentes = 0, faltas = 0, tardanzas = 0, justificados = 0;
    const counts = dias.map((dia) => {
      let count = 0;
      alumnosFiltrados.forEach((a) => {
        const aid = a.alumno_id || a.id_usuario;
        const e = grid[aid]?.[dia.fecha];
        if (e) {
          count++;
          if (e === 'presente') presentes++;
          else if (e === 'falta') faltas++;
          else if (e === 'tardanza') tardanzas++;
          else if (e === 'justificado') justificados++;
        }
      });
      return count > 0 ? count : '—';
    });
    const total = presentes + faltas + tardanzas + justificados;
    const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;
    return ['', 'Total grupo', '', ...counts, presentes, `${porcentaje}%`, faltas, tardanzas];
  };

  const construirDocAsistencias = () => {
    const diasVisibles = diasMes.filter((d) => !d.esFuturo);
    const secciones = [];

    if (vista === 'mes') {
      agruparPorSemana(diasVisibles).forEach(({ dias }, gIdx) => {
        secciones.push({
          titulo: `Semana ${gIdx + 1} — ${formatearFechaCorta(dias[0].fecha)} al ${formatearFechaCorta(dias[dias.length - 1].fecha)}`,
          columnas: ['#', 'Alumno', 'Turno', ...dias.map((d) => `${d.nombreCorto} ${d.numero}`), 'P', '%', 'F', 'T'],
          filas: [
            ...alumnosFiltrados.map((alumno, i) => construirFila(alumno, i, dias)),
            construirTotal(dias),
          ],
        });
      });
    } else {
      secciones.push({
        titulo: 'Detalle por alumno',
        columnas: ['#', 'Alumno', 'Turno', ...diasVisibles.map((d) => `${d.nombreCorto} ${d.numero}`), 'P', '%', 'F', 'T'],
        filas: [
          ...alumnosFiltrados.map((alumno, i) => construirFila(alumno, i, diasVisibles)),
          construirTotal(diasVisibles),
        ],
      });
    }

    return {
      titulo: 'Planilla de Asistencia',
      periodo: `${vista === 'semana' ? 'Semana' : 'Mes'} — ${textoPeriodo}`,
      generadoPor: JSON.parse(localStorage.getItem('user') || '{}')?.nombre || '',
      filtros: [
        { etiqueta: 'Período', valor: textoPeriodo },
        { etiqueta: 'Vista', valor: vista === 'semana' ? 'Semana' : 'Mes' },
        { etiqueta: 'Turno', valor: filtroTurno ? NOMBRES_TURNO[filtroTurno] || filtroTurno : 'Todos' },
        { etiqueta: 'Alumno', valor: alumnoSeleccionado ? (alumnoSeleccionado.alumno_nombre || alumnoSeleccionado.nombre) : (busqueda.trim() || '—') },
        { etiqueta: 'Días habilitados', valor: `${diasVisibles.length} (excluye fechas futuras)` },
      ],
      resumen: [
        { etiqueta: 'Alumnos', valor: resumenGrupo.totalAlumnos },
        { etiqueta: 'Presentes', valor: resumenGrupo.presentes, color: '#15803d' },
        { etiqueta: 'Faltas', valor: resumenGrupo.faltas, color: '#b91c1c' },
        { etiqueta: 'Tardanzas', valor: resumenGrupo.tardanzas, color: '#b45309' },
        { etiqueta: 'Justificados', valor: resumenGrupo.justificados, color: '#1d4ed8' },
        { etiqueta: '% Asistencia', valor: `${resumenGrupo.porcentaje}%`, color: '#6d28d9' },
      ],
      secciones,
      notasFinales: 'Códigos: P = Presente · F = Falta · T = Tardanza · J = Justificado. El reporte incluye únicamente los días habilitados del período; las fechas futuras quedan excluidas.',
    };
  };

  const abrirPreview = () => {
    setDocPreview(construirDocAsistencias());
    setPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#172033]">{titulo}</h2>
          <p className="text-slate-500 mt-1">{subtitulo}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <span>⚠️</span> {error}
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
                <option value="">Todos los turnos</option>
                {turnosUnicos.map(t => (
                  <option key={t} value={t}>{NOMBRES_TURNO[t] || t}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Buscar alumno</label>
              <div className="relative mt-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={busquedaRef}
                  type="text"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setAlumnoSeleccionado(null);
                    setAutocompleteAbierto(true);
                    setAutocompleteIdx(0);
                  }}
                  onFocus={() => { if (sugerencias.length > 0) setAutocompleteAbierto(true); }}
                  onKeyDown={manejarTeclaBusqueda}
                  placeholder="Nombre o CI..."
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500"
                />
                {(busqueda || alumnoSeleccionado) && (
                  <button
                    type="button"
                    onClick={limpiarBusqueda}
                    title="Limpiar búsqueda"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
                  >
                    ✕
                  </button>
                )}
                {autocompleteAbierto && sugerencias.length > 0 && (
                  <ul ref={sugerenciasRef} className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl">
                    {sugerencias.map((a, i) => (
                      <li key={a.alumno_id || a.id_usuario}>
                        <button
                          type="button"
                          onMouseEnter={() => setAutocompleteIdx(i)}
                          onClick={() => seleccionarAlumno(a)}
                          className={`w-full text-left px-3 py-2 text-sm border-b border-gray-50 last:border-0 ${
                            i === autocompleteIdx ? 'bg-invictus-50 text-invictus-800 font-medium' : 'text-[#172033]'
                          }`}
                        >
                          <span className="block">{a.alumno_nombre || a.nombre}</span>
                          <span className="block text-xs text-slate-400">
                            {a.alumno_correo || a.correo || '—'}{a.ci ? ` · CI: ${a.ci}` : ''}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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

            {/* Botón de vista previa y guardar */}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={abrirPreview}
                disabled={loading || alumnosFiltrados.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-5.414-5.414A2 2 0 0011.586 2H7a2 2 0 00-2 2v15a2 2 0 002 2z" />
                </svg>
                Vista previa PDF
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
          <span className="text-gray-400">{editable ? 'Clic para cambiar estado' : 'Vista de solo lectura'}</span>
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
              <p className="text-slate-500 font-medium">No hay alumnos</p>
              <p className="text-sm text-gray-400 mt-1">
                {busqueda.trim()
                  ? 'No hay alumnos que coincidan con la búsqueda'
                  : filtroTurno
                    ? `No hay alumnos en el turno ${NOMBRES_TURNO[filtroTurno] || filtroTurno}`
                    : 'No hay alumnos registrados para mostrar'}
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
                          const existe = asistenciasMap[`${alumnoId}_${dia.fecha}`];
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
                              ) : editable ? (
                                <div className="relative group">
                                  <button
                                    onClick={() => toggleCelda(alumnoId, dia.fecha)}
                                    title={`${alumno.alumno_nombre || 'Alumno'} — ${dia.nombreCorto} ${dia.numero}\nEstado: ${estadoObj.label}\nClic para cambiar`}
                                    className={`w-11 h-11 rounded-lg border-2 text-lg font-bold transition-all duration-150 cursor-pointer ${
                                      estadoObj.color
                                    }`}
                                  >
                                    {estadoObj.icon}
                                  </button>
                                  {existe && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setObsCelda({
                                          id: existe.id_asistencia,
                                          alumnoNombre: alumno.alumno_nombre || 'Alumno',
                                          diaLabel: `${dia.nombreCorto} ${dia.numero} ${dia.mes}`,
                                        });
                                        setObsTexto(existe.observacion || '');
                                      }}
                                      title="Añadir / editar observación"
                                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-300 shadow-sm text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                    >
                                      ✏️
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div
                                  className={`w-11 h-11 rounded-lg border-2 text-lg font-bold flex items-center justify-center ${
                                    estadoObj.color
                                  }`}
                                  title="Solo lectura"
                                >
                                  {estadoObj.icon}
                                </div>
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

        {editable && (
          <div className="mt-4 text-center text-xs text-gray-400">
            Los cambios se guardan automáticamente al hacer clic en una celda: vacío → ✅ Presente → ❌ Falta → ⏰ Tardanza → 🟦 Justificado → vacío
          </div>
        )}
      </div>

      {editable && obsCelda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071A2B]/40 px-4" onClick={() => setObsCelda(null)}>
          <div
            ref={obsRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl p-4 w-full max-w-sm"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-[#172033]">Observación de asistencia</h3>
              <button onClick={() => setObsCelda(null)} className="text-gray-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              {obsCelda.alumnoNombre} — {obsCelda.diaLabel}
            </p>
            <textarea
              value={obsTexto}
              onChange={(e) => setObsTexto(e.target.value)}
              rows={3}
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500 resize-none"
              placeholder="Escribe una observación (opcional)…"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setObsCelda(null)} className="px-3 py-1.5 text-sm text-slate-500 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={guardarObservacion}
                disabled={guardandoObs}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#1D3A5C] rounded-lg hover:bg-[#172f4b] disabled:opacity-50"
              >
                {guardandoObs ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportPDFPreview open={previewOpen} onClose={() => setPreviewOpen(false)} doc={docPreview} />
    </div>
  );
}

export default PlanillaAsistencia;