import { useState, useEffect, useCallback } from 'react';
import { useTituloPagina } from '../../hooks/useTituloPagina';
import { getResumenGeneral, getAsistenciasFiltradas, getReportePagos } from '../../services/reporteService';
import { getUsers } from '../../services/usuarioService';
import ReportPDFPreview from '../../components/ReportPDFPreview';
import Paginacion from '../../components/Paginacion';
import CabeceraPagina from '../../components/CabeceraPagina';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const ANIOS = [2024, 2025, 2026, 2027];
const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };
const ESTADOS_ASISTENCIA = ['presente', 'falta', 'tardanza', 'justificado', 'permiso'];
const ESTADOS_PAGO = ['pagado', 'pendiente', 'vencido'];

const ESTADO_ASISTENCIA_LABELS = {
  presente: 'Presente', falta: 'Falta', tardanza: 'Tardanza', justificado: 'Justificado', permiso: 'Permiso',
};
const ESTADO_PAGO_LABELS = { pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido' };

const formatMonto = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero.toFixed(2) : '0.00';
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(String(date).length === 10 ? `${date}T12:00:00` : date).toLocaleDateString('es-ES');
};

const hoyIso = () => new Date().toISOString().slice(0, 10);
const inicioMesIso = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

function Reportes() {
  useTituloPagina('Reportes');
  const [tipoReporte, setTipoReporte] = useState('resumen');

  const [resumenGeneral, setResumenGeneral] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(true);

  const [fechaInicio, setFechaInicio] = useState(inicioMesIso());
  const [fechaFin, setFechaFin] = useState(hoyIso());
  const [estadoAsistencia, setEstadoAsistencia] = useState('');
  const [entrenadorFiltro, setEntrenadorFiltro] = useState('');
  const [busquedaAsistencia, setBusquedaAsistencia] = useState('');
  const [entrenadores, setEntrenadores] = useState([]);
  const [datosAsistencia, setDatosAsistencia] = useState(null);
  const [loadingAsistencia, setLoadingAsistencia] = useState(false);

  const hoy = new Date();
  const [mesPago, setMesPago] = useState(hoy.getMonth() + 1);
  const [anioPago, setAnioPago] = useState(hoy.getFullYear());
  const [estadoPago, setEstadoPago] = useState('');
  const [turnoPago, setTurnoPago] = useState('');
  const [busquedaPago, setBusquedaPago] = useState('');
  const [datosPagos, setDatosPagos] = useState(null);
  const [loadingPagos, setLoadingPagos] = useState(false);

  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [docPreview, setDocPreview] = useState(null);
  const [pagAsis, setPagAsis] = useState(1);
  const [porPagAsis, setPorPagAsis] = useState(10);
  const [pagPagos, setPagPagos] = useState(1);
  const [porPagPagos, setPorPagPagos] = useState(10);

  const filasAsis = datosAsistencia?.filas || [];
  const visiblesAsis = filasAsis.slice((pagAsis - 1) * porPagAsis, pagAsis * porPagAsis);
  const filasPagosLista = datosPagos?.filas || [];
  const visiblesPagos = filasPagosLista.slice((pagPagos - 1) * porPagPagos, pagPagos * porPagPagos);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await getResumenGeneral();
        setResumenGeneral(data.resumen);
        const usersData = await getUsers('Entrenador');
        setEntrenadores(usersData.usuarios || []);
      } catch {
        setError('Error al cargar reportes');
      } finally {
        setLoadingResumen(false);
      }
    };
    cargar();
  }, []);

  const cargarAsistencias = useCallback(async () => {
    setLoadingAsistencia(true);
    setError('');
    try {
      const params = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
      if (estadoAsistencia) params.estado = estadoAsistencia;
      if (entrenadorFiltro) params.entrenador_id = entrenadorFiltro;
      if (busquedaAsistencia.trim()) params.busqueda = busquedaAsistencia.trim();
      const data = await getAsistenciasFiltradas(params);
      setDatosAsistencia(data.datos);
      setPagAsis(1);
    } catch {
      setError('Error al cargar el reporte de asistencias');
    } finally {
      setLoadingAsistencia(false);
    }
  }, [fechaInicio, fechaFin, estadoAsistencia, entrenadorFiltro, busquedaAsistencia]);

  const cargarPagos = useCallback(async () => {
    setLoadingPagos(true);
    setError('');
    try {
      const params = { mes: mesPago, anio: anioPago };
      if (estadoPago) params.estado = estadoPago;
      if (turnoPago) params.turno = turnoPago;
      if (busquedaPago.trim()) params.busqueda = busquedaPago.trim();
      const data = await getReportePagos(params);
      setDatosPagos(data.datos);
      setPagPagos(1);
    } catch {
      setError('Error al cargar el reporte de pagos');
    } finally {
      setLoadingPagos(false);
    }
  }, [mesPago, anioPago, estadoPago, turnoPago, busquedaPago]);

  const periodoTexto = `Período: ${formatDate(fechaInicio)} al ${formatDate(fechaFin)}`;
  const periodoTextoPagos = `Período: ${MESES[mesPago - 1]} ${anioPago}`;

  const construirDocResumen = () => ({
    titulo: 'Resumen General del Sistema',
    periodo: `Fecha de corte: ${new Date().toLocaleDateString('es-ES')}`,
    generadoPor: JSON.parse(localStorage.getItem('user') || '{}')?.nombre,
    filtros: [{ etiqueta: 'Alcance', valor: 'Todos los registros del sistema' }],
    resumen: [
      { etiqueta: 'Total Usuarios', valor: resumenGeneral?.total_usuarios ?? 0 },
      { etiqueta: 'Alumnos', valor: resumenGeneral?.total_alumnos ?? 0, color: '#1d4ed8' },
      { etiqueta: 'Pagados', valor: resumenGeneral?.alumnos_pagados ?? 0, color: '#15803d' },
      { etiqueta: 'Entrenadores', valor: resumenGeneral?.total_entrenadores ?? 0, color: '#6d28d9' },
    ],
    secciones: [
      {
        titulo: 'Usuarios por rol',
        nota: 'Cantidad de usuarios registrados agrupados por rol en el sistema.',
        columnas: ['Rol', 'Cantidad'],
        filas: [
          ['Alumnos', resumenGeneral?.total_alumnos ?? 0],
          ['Entrenadores', resumenGeneral?.total_entrenadores ?? 0],
          ['Administradores', resumenGeneral?.total_administradores ?? 0],
          ['Total general', resumenGeneral?.total_usuarios ?? 0],
        ],
      },
      {
        titulo: 'Asistencias',
        columnas: ['Concepto', 'Cantidad'],
        filas: [
          ['Asistencias totales', resumenGeneral?.asistencias_totales ?? 0],
          ['Presentes', resumenGeneral?.asistencias_presentes ?? 0],
          ['Faltas', resumenGeneral?.asistencias_faltas ?? 0],
          ['Alumnos pagados (habilitados)', resumenGeneral?.alumnos_pagados ?? 0],
        ],
      },
      {
        titulo: 'Horarios',
        columnas: ['Concepto', 'Cantidad'],
        filas: [
          ['Horarios totales', resumenGeneral?.horarios_totales ?? 0],
          ['Horarios activos', resumenGeneral?.horarios_activos ?? 0],
        ],
      },
    ],
  });

  const construirDocAsistencias = () => ({
    titulo: 'Reporte de Asistencias con Filtros',
    periodo: periodoTexto,
    generadoPor: JSON.parse(localStorage.getItem('user') || '{}')?.nombre,
    filtros: [
      { etiqueta: 'Desde', valor: formatDate(fechaInicio) },
      { etiqueta: 'Hasta', valor: formatDate(fechaFin) },
      { etiqueta: 'Estado', valor: estadoAsistencia ? ESTADO_ASISTENCIA_LABELS[estadoAsistencia] : 'Todos' },
      { etiqueta: 'Entrenador', valor: entrenadorFiltro ? entrenadores.find((e) => String(e.id_usuario) === String(entrenadorFiltro))?.nombre || entrenadorFiltro : 'Todos' },
      { etiqueta: 'Búsqueda', valor: busquedaAsistencia.trim() || '—' },
    ],
    resumen: [
      { etiqueta: 'Registros', valor: datosAsistencia?.resumen?.total ?? 0 },
      { etiqueta: 'Presentes', valor: datosAsistencia?.resumen?.presentes ?? 0, color: '#15803d' },
      { etiqueta: 'Faltas', valor: datosAsistencia?.resumen?.faltas ?? 0, color: '#b91c1c' },
      { etiqueta: 'Tardanzas', valor: datosAsistencia?.resumen?.tardanzas ?? 0, color: '#b45309' },
      { etiqueta: 'Justificados', valor: datosAsistencia?.resumen?.justificados ?? 0 },
    ],
    secciones: [
      {
        titulo: 'Detalle de asistencias',
        nota: 'Elaboración propia a partir de los registros del módulo de asistencias.',
        columnas: ['#', 'Fecha', 'Alumno', 'Entrenador', 'Estado', 'Observación'],
        filas: (datosAsistencia?.filas || []).map((f, i) => [
          i + 1,
          formatDate(f.fecha),
          f.alumno_nombre || '—',
          f.entrenador_nombre || '—',
          ESTADO_ASISTENCIA_LABELS[f.estado] || f.estado,
          f.observacion || '—',
        ]),
      },
    ],
  });

  const construirDocPagos = () => ({
    titulo: 'Reporte de Pagos y Mensualidades',
    periodo: periodoTextoPagos,
    generadoPor: JSON.parse(localStorage.getItem('user') || '{}')?.nombre,
    filtros: [
      { etiqueta: 'Mes', valor: MESES[mesPago - 1] },
      { etiqueta: 'Año', valor: anioPago },
      { etiqueta: 'Estado', valor: estadoPago ? ESTADO_PAGO_LABELS[estadoPago] : 'Todos' },
      { etiqueta: 'Turno', valor: turnoPago ? NOMBRES_TURNO[turnoPago] : 'Todos' },
      { etiqueta: 'Búsqueda', valor: busquedaPago.trim() || '—' },
    ],
    resumen: [
      { etiqueta: 'Total Alumnos', valor: datosPagos?.resumen?.total_alumnos ?? '—' },
      { etiqueta: 'Pagados', valor: datosPagos?.filtros_aplicados?.pagados ?? 0, color: '#15803d' },
      { etiqueta: 'Pendientes', valor: datosPagos?.filtros_aplicados?.pendientes ?? 0, color: '#b45309' },
      { etiqueta: 'Vencidos', valor: datosPagos?.filtros_aplicados?.vencidos ?? 0, color: '#b91c1c' },
      { etiqueta: 'Ingresos Bs.', valor: formatMonto(datosPagos?.filtros_aplicados?.ingresos) },
    ],
    secciones: [
      {
        titulo: 'Detalle por alumno',
        columnas: ['#', 'Alumno', 'Turno', 'Estado', 'Monto', 'Fecha Pago', 'Vencimiento'],
        filas: (datosPagos?.filas || []).map((p, i) => [
          i + 1,
          p.alumno_nombre,
          p.turno ? NOMBRES_TURNO[p.turno] || p.turno : '—',
          ESTADO_PAGO_LABELS[p.estado_pago] || p.estado_pago || '—',
          p.estado_pago === 'pagado' ? `Bs ${formatMonto(p.monto)}` : '—',
          p.estado_pago === 'pagado' ? formatDate(p.fecha_pago) : '—',
          formatDate(p.fecha_vencimiento),
        ]),
      },
    ],
  });

  const abrirPreview = () => {
    if (tipoReporte === 'resumen') setDocPreview(construirDocResumen());
    else if (tipoReporte === 'asistencias') setDocPreview(construirDocAsistencias());
    else setDocPreview(construirDocPagos());
    setPreviewOpen(true);
  };

  const tabs = [
    { id: 'resumen', label: 'Resumen General' },
    { id: 'asistencias', label: 'Asistencias' },
    { id: 'pagos', label: 'Pagos' },
  ];

  const cargando = (tipoReporte === 'resumen' && loadingResumen)
    || (tipoReporte === 'asistencias' && loadingAsistencia)
    || (tipoReporte === 'pagos' && loadingPagos);

  return (
    <div>
      <CabeceraPagina
        titulo="Reportes"
        subtitulo="Indicadores generales de alumnos, pagos y asistencias"
        acciones={!cargando && (
          <button
            onClick={abrirPreview}
            className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-5.414-5.414A2 2 0 0011.586 2H7a2 2 0 00-2 2v15a2 2 0 002 2z" /></svg>
            Vista previa PDF
          </button>
        )}
      />

      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTipoReporte(t.id);
              setError('');
              if (t.id === 'asistencias' && !datosAsistencia) cargarAsistencias();
              if (t.id === 'pagos' && !datosPagos) cargarPagos();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tipoReporte === t.id
                ? 'bg-invictus-600 text-white'
                : 'text-slate-500 hover:text-[#172033] hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {cargando && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
        </div>
      )}

      {/* ===================== RESUMEN GENERAL ===================== */}
      {tipoReporte === 'resumen' && !cargando && resumenGeneral && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Usuarios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Usuarios', value: resumenGeneral.total_usuarios, color: 'text-[#172033]' },
              { borde: 'border-l-sky-500', label: 'Alumnos', value: resumenGeneral.total_alumnos, color: 'text-blue-600' },
              { label: 'Alumnos Pagados', value: resumenGeneral.alumnos_pagados, color: 'text-green-600' },
              { label: 'Entrenadores', value: resumenGeneral.total_entrenadores, color: 'text-purple-600' },
              { label: 'Administradores', value: resumenGeneral.total_administradores, color: 'text-amber-600' },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-5">
                <p className="text-sm text-slate-500 font-medium">{c.label}</p>
                <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-gray-700 mb-3">Asistencias</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Asistencias Totales', value: resumenGeneral.asistencias_totales, color: 'text-indigo-600' },
              { borde: 'border-l-green-500', label: 'Presentes', value: resumenGeneral.asistencias_presentes, color: 'text-green-600' },
              { borde: 'border-l-red-500', label: 'Faltas', value: resumenGeneral.asistencias_faltas, color: 'text-red-600' },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-5">
                <p className="text-sm text-slate-500 font-medium">{c.label}</p>
                <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-gray-700 mb-3">Horarios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Horarios Totales', value: resumenGeneral.horarios_totales, color: 'text-teal-600' },
              { label: 'Horarios Activos', value: resumenGeneral.horarios_activos, color: 'text-green-600' },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-5">
                <p className="text-sm text-slate-500 font-medium">{c.label}</p>
                <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===================== ASISTENCIAS ===================== */}
      {tipoReporte === 'asistencias' && !cargando && (
        <>
          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4 mb-5">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Desde</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Hasta</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Estado</label>
                <select value={estadoAsistencia} onChange={(e) => setEstadoAsistencia(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                  <option value="">Todos</option>
                  {ESTADOS_ASISTENCIA.map((e) => (
                    <option key={e} value={e}>{ESTADO_ASISTENCIA_LABELS[e]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Entrenador</label>
                <select value={entrenadorFiltro} onChange={(e) => setEntrenadorFiltro(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white max-w-[190px]">
                  <option value="">Todos</option>
                  {entrenadores.map((en) => (
                    <option key={en.id_usuario} value={en.id_usuario}>{en.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs text-slate-500 mb-1">Buscar alumno</label>
                <input type="text" placeholder="Nombre o correo..." value={busquedaAsistencia}
                  onChange={(e) => setBusquedaAsistencia(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && cargarAsistencias()}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              </div>
              <button onClick={cargarAsistencias}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black">
                Aplicar filtros
              </button>
            </div>
          </div>

          {datosAsistencia && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
                {[
                  { borde: 'border-l-blue-500', label: 'Registros', value: datosAsistencia.resumen.total, color: 'text-[#172033]' },
                  { borde: 'border-l-green-500', label: 'Presentes', value: datosAsistencia.resumen.presentes, color: 'text-green-600' },
                  { borde: 'border-l-red-500', label: 'Faltas', value: datosAsistencia.resumen.faltas, color: 'text-red-600' },
                  { borde: 'border-l-amber-500', label: 'Tardanzas', value: datosAsistencia.resumen.tardanzas, color: 'text-amber-600' },
                  { borde: 'border-l-indigo-500', label: 'Justificados', value: datosAsistencia.resumen.justificados, color: 'text-indigo-600' },
                  { borde: 'border-l-sky-500', label: 'Alumnos', value: datosAsistencia.resumen.alumnos_distintos, color: 'text-blue-600' },
                  { borde: 'border-l-teal-500', label: 'Días', value: datosAsistencia.resumen.dias_distintos, color: 'text-purple-600' },
                ].map((c) => (
                  <div key={c.label} className={`bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 ${c.borde || ""} p-4 text-center`}>
                    <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-slate-500 font-medium">{c.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Detalle de asistencias ({periodoTexto.replace('Período: ', '')})</h3>
                  <span className="text-xs text-gray-400">{datosAsistencia.filas.length} registros</span>
                </div>
                {datosAsistencia.filas.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No hay registros con los filtros aplicados</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px]">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                          <th className="px-4 py-3 font-semibold">#</th>
                          <th className="px-4 py-3 font-semibold">Fecha</th>
                          <th className="px-4 py-3 font-semibold">Alumno</th>
                          <th className="px-4 py-3 font-semibold">Entrenador</th>
                          <th className="px-4 py-3 font-semibold">Estado</th>
                          <th className="px-4 py-3 font-semibold">Observación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiblesAsis.map((f, idx) => (
                          <tr key={f.id_asistencia || idx} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-400">{(pagAsis - 1) * porPagAsis + idx + 1}</td>
                            <td className="px-4 py-3 text-sm text-slate-500">{formatDate(f.fecha)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-[#172033]">{f.alumno_nombre || '—'}</td>
                            <td className="px-4 py-3 text-sm text-slate-500">{f.entrenador_nombre || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                f.estado === 'presente' ? 'bg-green-100 text-green-700'
                                  : f.estado === 'falta' ? 'bg-red-100 text-red-700'
                                    : f.estado === 'tardanza' ? 'bg-amber-100 text-amber-700'
                                      : f.estado === 'justificado' ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-100 text-slate-600'
                              }`}>
                                {ESTADO_ASISTENCIA_LABELS[f.estado] || f.estado}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">{f.observacion || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {filasAsis.length > 0 && (
                  <Paginacion total={filasAsis.length} pagina={pagAsis} porPagina={porPagAsis}
                    setPagina={setPagAsis} setPorPagina={setPorPagAsis} />
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ===================== PAGOS ===================== */}
      {tipoReporte === 'pagos' && !cargando && (
        <>
          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4 mb-5">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Mes</label>
                <select value={mesPago} onChange={(e) => setMesPago(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                  {MESES.map((label, idx) => (
                    <option key={idx + 1} value={idx + 1}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Año</label>
                <select value={anioPago} onChange={(e) => setAnioPago(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                  {ANIOS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Estado</label>
                <select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                  <option value="">Todos</option>
                  {ESTADOS_PAGO.map((e) => (
                    <option key={e} value={e}>{ESTADO_PAGO_LABELS[e]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Turno</label>
                <select value={turnoPago} onChange={(e) => setTurnoPago(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
                  <option value="">Todos</option>
                  {Object.entries(NOMBRES_TURNO).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs text-slate-500 mb-1">Buscar alumno</label>
                <input type="text" placeholder="Nombre, correo o CI..." value={busquedaPago}
                  onChange={(e) => setBusquedaPago(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && cargarPagos()}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              </div>
              <button onClick={cargarPagos}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black">
                Aplicar filtros
              </button>
            </div>
          </div>

          {datosPagos && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
                {[
                  { borde: 'border-l-blue-500', label: 'Alumnos listados', value: datosPagos.filas.length, color: 'text-[#172033]' },
                  { borde: 'border-l-green-500', label: 'Pagados', value: datosPagos.filtros_aplicados.pagados, color: 'text-green-600' },
                  { borde: 'border-l-amber-500', label: 'Pendientes', value: datosPagos.filtros_aplicados.pendientes, color: 'text-amber-600' },
                  { borde: 'border-l-red-500', label: 'Vencidos', value: datosPagos.filtros_aplicados.vencidos, color: 'text-red-600' },
                  { borde: 'border-l-violet-500', label: 'Ingresos Bs.', value: formatMonto(datosPagos.filtros_aplicados.ingresos), color: 'text-indigo-600' },
                ].map((c) => (
                  <div key={c.label} className={`bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 ${c.borde || ""} p-4 text-center`}>
                    <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-slate-500 font-medium">{c.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Detalle por alumno — {MESES[mesPago - 1]} {anioPago}</h3>
                  <span className="text-xs text-gray-400">{datosPagos.filas.length} alumnos</span>
                </div>
                {datosPagos.filas.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No hay registros con los filtros aplicados</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                          <th className="px-4 py-3 font-semibold">#</th>
                          <th className="px-4 py-3 font-semibold">Alumno</th>
                          <th className="px-4 py-3 font-semibold">Turno</th>
                          <th className="px-4 py-3 font-semibold">Estado</th>
                          <th className="px-4 py-3 font-semibold text-right">Monto</th>
                          <th className="px-4 py-3 font-semibold">Fecha Pago</th>
                          <th className="px-4 py-3 font-semibold">Vencimiento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiblesPagos.map((p, idx) => (
                          <tr key={`${p.alumno_id}_${idx}`} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-400">{(pagPagos - 1) * porPagPagos + idx + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium text-[#172033]">{p.alumno_nombre}</td>
                            <td className="px-4 py-3 text-sm text-slate-500">{p.turno ? NOMBRES_TURNO[p.turno] || p.turno : '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                p.estado_pago === 'pagado' ? 'bg-green-100 text-green-800'
                                  : p.estado_pago === 'vencido' ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {ESTADO_PAGO_LABELS[p.estado_pago] || p.estado_pago}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-[#172033]">
                              {p.estado_pago === 'pagado' ? `Bs ${formatMonto(p.monto)}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">{p.estado_pago === 'pagado' ? formatDate(p.fecha_pago) : '—'}</td>
                            <td className="px-4 py-3 text-sm text-slate-500">{formatDate(p.fecha_vencimiento)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {filasPagosLista.length > 0 && (
                  <Paginacion total={filasPagosLista.length} pagina={pagPagos} porPagina={porPagPagos}
                    setPagina={setPagPagos} setPorPagina={setPorPagPagos} />
                )}
              </div>
            </>
          )}
        </>
      )}

      <ReportPDFPreview open={previewOpen} onClose={() => setPreviewOpen(false)} doc={docPreview} />
    </div>
  );
}

export default Reportes;
