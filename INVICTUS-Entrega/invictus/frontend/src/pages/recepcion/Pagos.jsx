import { useState, useEffect, useMemo, useRef } from 'react';
import { useTituloPagina } from '../../hooks/useTituloPagina';
import { getPagos, marcarPagado, actualizarPago, getResumenPagos, getHistorialAlumno } from '../../services/pagoService';
import { getUsers } from '../../services/usuarioService';
import { useAuth } from '../../context/AuthContext';
import CabeceraPagina from '../../components/CabeceraPagina';
import ReportPDFPreview from '../../components/ReportPDFPreview';
import ActionButton from '../../components/ActionButton';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ANIOS = [2024, 2025, 2026, 2027];

const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

const formatMonto = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero.toFixed(2) : '0.00';
};

function RecepcionPagos() {
  useTituloPagina('Gestión de Pagos');
  const { user } = useAuth();
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [esFuturo, setEsFuturo] = useState(false);

  const [alumnos, setAlumnos] = useState([]);
  const [autocompleteAbierto, setAutocompleteAbierto] = useState(false);
  const [autocompleteIdx, setAutocompleteIdx] = useState(0);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const busquedaRef = useRef(null);
  const sugerenciasRef = useRef(null);

  const [showPagoModal, setShowPagoModal] = useState(false);
  const [modoPago, setModoPago] = useState('registrar');
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [selectedPagoId, setSelectedPagoId] = useState(null);
  const [formPago, setFormPago] = useState({
    monto: '200',
    estado: 'pagado',
    metodo_pago: 'efectivo',
    fecha_pago: hoy.toISOString().slice(0, 10),
    fecha_vencimiento: '',
    observacion: '',
  });

  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historialAlumnoData, setHistorialAlumnoData] = useState([]);
  const [historialNombre, setHistorialNombre] = useState('');
  const [historialLoading, setHistorialLoading] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [docPreview, setDocPreview] = useState(null);

  const fetchPagos = async () => {
    setLoading(true);
    try {
      const params = { mes, anio };
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroTurno) params.turno = filtroTurno;
      if (busqueda.trim()) params.busqueda = busqueda.trim();
      const data = await getPagos(params);
      setPagos(data.pagos || []);
      setEsFuturo(Boolean(data.es_futuro));
    } catch (err) {
      const msg = err?.response?.data?.msg || 'Error al cargar pagos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumen = async () => {
    try {
      const data = await getResumenPagos({ mes, anio });
      setResumen(data.resumen);
      setEsFuturo(Boolean(data.es_futuro));
    } catch {}
  };

  useEffect(() => {
    fetchPagos();
    fetchResumen();
  }, [mes, anio]);

  useEffect(() => {
    fetchPagos();
  }, [filtroEstado, filtroTurno]);

  useEffect(() => {
    const t = setTimeout(() => { fetchPagos(); }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    const cargarAlumnos = async () => {
      try {
        const data = await getUsers('Alumno');
        setAlumnos(data.usuarios || []);
      } catch {}
    };
    cargarAlumnos();
  }, []);

  const sugerencias = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return alumnos
      .filter((a) => (
        `${a.nombre || ''} ${a.correo || ''} ${a.ci || ''}`.toLowerCase().includes(q)
      ))
      .slice(0, 8);
  }, [alumnos, busqueda]);

  const seleccionarAlumno = (alumno) => {
    setBusqueda(alumno.nombre || '');
    setAlumnoSeleccionado(alumno);
    setAutocompleteAbierto(false);
    setAutocompleteIdx(0);
  };

  const pagosVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return pagos;
    return pagos.filter((p) =>
      `${p.alumno_nombre || ''} ${p.alumno_correo || ''}`.toLowerCase().includes(q)
    );
  }, [pagos, busqueda]);

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
        setAlumnoSeleccionado(null);
      }
    } else if (e.key === 'Escape') {
      setAutocompleteAbierto(false);
    }
  };

const resumenEfectivo = useMemo(() => {
    if (esFuturo) return null;
    const hayConsulta = Boolean(busqueda.trim() || alumnoSeleccionado);
    if (hayConsulta) {
      const pagados = pagosVisibles.filter((p) => p.estado === 'pagado').length;
      const vencidos = pagosVisibles.filter((p) => p.estado === 'vencido').length;
      const pendientes = pagosVisibles.length - pagados - vencidos;
      const ingresos = pagosVisibles
        .filter((p) => p.estado === 'pagado')
        .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
      return {
        total_alumnos: pagosVisibles.length,
        pagados_mes: pagados,
        pendientes_mes: pendientes < 0 ? 0 : pendientes,
        vencidos,
        ingresos_mes: ingresos,
        inscritos_hoy: null,
        inscritos_semana: null,
        inscritos_mes: null,
      };
    }
    return resumen;
  }, [busqueda, alumnoSeleccionado, pagosVisibles, resumen, esFuturo]);

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

  const openPagoModal = (alumno) => {
    setSelectedAlumno(alumno);
    setSelectedPagoId(null);
    setModoPago('registrar');
    setFormPago({
      monto: '200',
      estado: 'pagado',
      metodo_pago: 'efectivo',
      fecha_pago: new Date().toISOString().slice(0, 10),
      fecha_vencimiento: '',
      observacion: '',
    });
    setShowPagoModal(true);
  };

  const openEditarPago = (p) => {
    setSelectedAlumno(p);
    setSelectedPagoId(p.id_pago);
    setModoPago('editar');
    setFormPago({
      monto: p.monto ? String(p.monto) : '200',
      estado: p.estado || 'pagado',
      metodo_pago: p.metodo_pago || 'efectivo',
      fecha_pago: p.fecha_pago ? String(p.fecha_pago).slice(0, 10) : '',
      fecha_vencimiento: p.fecha_vencimiento ? String(p.fecha_vencimiento).slice(0, 10) : '',
      observacion: p.observacion || '',
    });
    setShowPagoModal(true);
  };

  const handleGuardarPago = async (e) => {
    e.preventDefault();
    if (!selectedAlumno) return;
    try {
      if (modoPago === 'editar' && selectedPagoId) {
        await actualizarPago(selectedPagoId, {
          monto: parseFloat(formPago.monto),
          estado: formPago.estado,
          metodo_pago: formPago.metodo_pago,
          fecha_pago: formPago.fecha_pago || null,
          fecha_vencimiento: formPago.fecha_vencimiento || null,
          observacion: formPago.observacion || null,
        });
        setSuccess(`Pago actualizado: ${selectedAlumno.alumno_nombre}`);
      } else {
        await marcarPagado({
          alumno_id: selectedAlumno.alumno_id,
          mes,
          anio,
          monto: parseFloat(formPago.monto),
          metodo_pago: formPago.metodo_pago,
          fecha_pago: formPago.fecha_pago,
          observacion: formPago.observacion || null,
        });
        setSuccess(`Pago registrado: ${selectedAlumno.alumno_nombre}`);
      }
      setShowPagoModal(false);
      fetchPagos();
      fetchResumen();
    } catch (err) {
      const msg = err?.response?.data?.msg || 'Error al registrar pago';
      setError(msg);
    }
  };

  const openHistorial = async (alumno) => {
    setHistorialNombre(alumno.alumno_nombre);
    setShowHistorialModal(true);
    setHistorialLoading(true);
    try {
      const data = await getHistorialAlumno(alumno.alumno_id);
      setHistorialAlumnoData(data.historial || []);
    } catch {
      setHistorialAlumnoData([]);
    } finally {
      setHistorialLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      pagado: 'bg-green-100 text-green-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      vencido: 'bg-red-100 text-red-800',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-[#172033]'}`;
  };

  const getLabelEstado = (estado) => {
    const labels = { pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido' };
    return labels[estado] || estado;
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('');
    setFiltroTurno('');
    setAlumnoSeleccionado(null);
    setAutocompleteAbierto(false);
  };

  const hayFiltrosActivos = Boolean(busqueda.trim() || filtroEstado || filtroTurno || alumnoSeleccionado);

  const construirDocPagos = () => {
    const pagados = pagosVisibles.filter((p) => p.estado === 'pagado').length;
    const vencidos = pagosVisibles.filter((p) => p.estado === 'vencido').length;
    const pendientes = pagosVisibles.length - pagados - vencidos;
    const ingresos = pagosVisibles
      .filter((p) => p.estado === 'pagado')
      .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
    return {
      titulo: 'Planilla de Pagos y Mensualidades',
      periodo: `${MESES[mes - 1]} ${anio}`,
      generadoPor: user?.nombre || '',
      filtros: [
        { etiqueta: 'Período', valor: `${MESES[mes - 1]} ${anio}` },
        { etiqueta: 'Estado', valor: filtroEstado ? getLabelEstado(filtroEstado) : 'Todos' },
        { etiqueta: 'Turno', valor: filtroTurno ? NOMBRES_TURNO[filtroTurno] : 'Todos' },
        { etiqueta: 'Búsqueda', valor: busqueda.trim() || '—' },
      ],
      resumen: [
        { etiqueta: 'Alumnos listados', valor: pagosVisibles.length },
        { etiqueta: 'Pagados', valor: pagados, color: '#15803d' },
        { etiqueta: 'Pendientes', valor: pendientes < 0 ? 0 : pendientes, color: '#b45309' },
        { etiqueta: 'Vencidos', valor: vencidos, color: '#b91c1c' },
        { etiqueta: 'Ingresos Bs.', valor: formatMonto(ingresos), color: '#1d4ed8' },
      ],
      secciones: [
        {
          titulo: 'Detalle por alumno',
          columnas: ['#', 'Alumno', 'Turno', 'Estado', 'Monto', 'Fecha Pago', 'Vencimiento', 'Método'],
          filas: pagosVisibles.map((p, i) => [
            i + 1,
            p.alumno_nombre,
            p.turno ? NOMBRES_TURNO[p.turno] || p.turno : '—',
            getLabelEstado(p.estado),
            p.estado === 'pagado' ? `Bs ${formatMonto(p.monto)}` : '—',
            p.estado === 'pagado' ? formatDate(p.fecha_pago) : '—',
            formatDate(p.fecha_vencimiento),
            p.metodo_pago || '—',
          ]),
        },
      ],
    };
  };

  const abrirPreview = () => {
    setDocPreview(construirDocPagos());
    setPreviewOpen(true);
  };

  return (
    <>
    <div>
      <CabeceraPagina
        titulo="Gestión de Pagos"
        subtitulo="Control mensual de mensualidades e inscripciones"
        acciones={(
          <div className="flex items-center gap-2">
            {!esFuturo && (
              <button
                onClick={abrirPreview}
                disabled={loading || pagosVisibles.length === 0}
                className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-5.414-5.414A2 2 0 0011.586 2H7a2 2 0 00-2 2v15a2 2 0 002 2z" /></svg>
                Vista previa PDF
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 bg-invictus-50 border border-invictus-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-invictus-700">
              📅 {MESES[mes - 1]} {anio}
            </span>
          </div>
        )}
      />

      {/* ── Barra de filtros ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4 mb-5">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Período</label>
            <div className="flex gap-2">
              <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500">
                {MESES.map((label, idx) => (
                  <option key={idx + 1} value={idx + 1}>{label}</option>
                ))}
              </select>
              <select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500">
                {ANIOS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Estado de pago</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500 ${filtroEstado ? 'border-invictus-400 text-invictus-700 font-medium' : 'border-gray-300'}`}>
              <option value="">Todos los estados</option>
              {['pagado', 'pendiente', 'vencido'].map((est) => (
                <option key={est} value={est}>{getLabelEstado(est)}</option>
              ))}
            </select>
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

          <div className="flex-1 min-w-[230px]">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Buscar alumno</label>
            <div className="relative">
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
                placeholder="Nombre, correo o CI..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500"
              />
              {autocompleteAbierto && sugerencias.length > 0 && (
                <ul ref={sugerenciasRef} className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl">
                  {sugerencias.map((a, i) => (
                    <li key={a.id_usuario}>
                      <button
                        type="button"
                        onMouseEnter={() => setAutocompleteIdx(i)}
                        onClick={() => seleccionarAlumno(a)}
                        className={`w-full text-left px-3 py-2 text-sm border-b border-gray-50 last:border-0 ${
                          i === autocompleteIdx ? 'bg-invictus-50 text-invictus-800 font-medium' : 'text-[#172033]'
                        }`}
                      >
                        <span className="block">{a.nombre}</span>
                        <span className="block text-xs text-slate-400">
                          {a.correo || '—'}{a.ci ? ` · CI: ${a.ci}` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros}
              className="px-4 py-2 text-sm font-medium text-slate-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">{success}</div>}

      {esFuturo && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 text-sm text-amber-800 flex items-center gap-3">
          <span className="text-xl">📅</span>
          <span>
            <strong>{MESES[mes - 1]} {anio}</strong> es un período futuro y aún no tiene movimientos.
            No se muestran registros en períodos futuros; selecciona el mes y año actual o uno anterior.
          </span>
        </div>
      )}

      {!esFuturo && resumenEfectivo && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 border-l-blue-500 p-4">
              <p className="text-xs text-slate-500 font-medium">Total Alumnos</p>
              <p className="text-2xl font-bold text-[#172033] mt-1">{resumenEfectivo.total_alumnos}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 border-l-green-500 p-4">
              <p className="text-xs text-slate-500 font-medium">Pagados del Mes</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{resumenEfectivo.pagados_mes}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 border-l-amber-500 p-4">
              <p className="text-xs text-slate-500 font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{resumenEfectivo.pendientes_mes}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 border-l-red-500 p-4">
              <p className="text-xs text-slate-500 font-medium">Vencidos</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{resumenEfectivo.vencidos}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 border-l-violet-500 p-4">
              <p className="text-xs text-slate-500 font-medium">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-[#172033] mt-1">Bs {formatMonto(resumenEfectivo.ingresos_mes)}</p>
            </div>
          </div>
          {!alumnoSeleccionado && !busqueda.trim() && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800 flex items-center gap-2">
                <span className="font-semibold">Inscritos hoy:</span>
                <span className="text-lg font-bold">{resumenEfectivo.inscritos_hoy}</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800 flex items-center gap-2">
                <span className="font-semibold">Inscritos esta semana:</span>
                <span className="text-lg font-bold">{resumenEfectivo.inscritos_semana}</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800 flex items-center gap-2">
                <span className="font-semibold">Inscritos este mes:</span>
                <span className="text-lg font-bold">{resumenEfectivo.inscritos_mes}</span>
              </div>
            </div>
          )}
        </>
      )}

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">{success}</div>}

      {!esFuturo && (
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
            </div>
          ) : pagosVisibles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No hay alumnos que coincidan con el período o la búsqueda</div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Turno</th>
                  <th className="px-4 py-3 font-semibold text-center">Mes</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Monto</th>
                  <th className="px-4 py-3 font-semibold">Inscripción</th>
                  <th className="px-4 py-3 font-semibold">Fecha Pago</th>
                  <th className="px-4 py-3 font-semibold">Vencimiento</th>
                  <th className="px-4 py-3 font-semibold">Método</th>
                  <th className="px-4 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pagosVisibles.map((p) => (
                  <tr key={`${p.alumno_id}_${p.mes}_${p.anio}`} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-[#172033]">{p.alumno_nombre}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{p.turno ? NOMBRES_TURNO[p.turno] || p.turno : '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 text-center">{MESES[p.mes - 1]} {p.anio}</td>
                    <td className="px-4 py-3">
                      <span className={getEstadoBadge(p.estado)}>
                        {getLabelEstado(p.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[#172033] font-medium">
                      {p.estado === 'pagado' ? `Bs ${formatMonto(p.monto)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(p.fecha_inscripcion)}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{p.estado === 'pagado' ? formatDate(p.fecha_pago) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(p.fecha_vencimiento)}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{p.metodo_pago || '—'}</td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {p.estado !== 'pagado' && (
                        <ActionButton tipo="pagado" onClick={() => openPagoModal(p)} />
                      )}
                      <ActionButton tipo="editar" onClick={() => openEditarPago(p)} />
                      <ActionButton tipo="historial" onClick={() => openHistorial(p)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}

      {showPagoModal && selectedAlumno && (
        <div className="fixed inset-0 bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-bold text-[#172033] mb-4">
              {modoPago === 'editar' ? 'Editar Pago' : 'Registrar Pago'}
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-[#172033]">{selectedAlumno.alumno_nombre}</p>
              <p className="text-xs text-slate-500">{MESES[mes - 1]} {anio}</p>
            </div>
            <form onSubmit={handleGuardarPago} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Monto (Bs)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPago.monto}
                  onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              {modoPago === 'editar' && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Estado</label>
                  <select
                    value={formPago.estado}
                    onChange={(e) => setFormPago({ ...formPago, estado: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Método de pago</label>
                <select
                  value={formPago.metodo_pago}
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Fecha de pago</label>
                <input
                  type="date"
                  value={formPago.fecha_pago}
                  onChange={(e) => setFormPago({ ...formPago, fecha_pago: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required={modoPago !== 'editar'}
                />
              </div>
              {modoPago === 'editar' && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Fecha de vencimiento</label>
                  <input
                    type="date"
                    value={formPago.fecha_vencimiento}
                    onChange={(e) => setFormPago({ ...formPago, fecha_vencimiento: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Observación (opcional)</label>
                <textarea
                  value={formPago.observacion}
                  onChange={(e) => setFormPago({ ...formPago, observacion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows="2"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPagoModal(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-[#172033]">Cancelar</button>
                <button type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                  {modoPago === 'editar' ? 'Guardar Cambios' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistorialModal && (
        <div className="fixed inset-0 bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-lg mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Historial de Pagos</h3>
                <p className="text-sm text-slate-500">{historialNombre}</p>
              </div>
              <button onClick={() => setShowHistorialModal(false)} className="text-gray-400 hover:text-slate-500 text-xl">&times;</button>
            </div>
            {historialLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
              </div>
            ) : historialAlumnoData.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No hay historial de pagos</div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-gray-100">
                      <th className="px-3 py-2 font-medium">Mes</th>
                      <th className="px-3 py-2 font-medium">Monto</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                      <th className="px-3 py-2 font-medium">Fecha Pago</th>
                      <th className="px-3 py-2 font-medium">Método</th>
                      <th className="px-3 py-2 font-medium">Registrado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialAlumnoData.map((h, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-[#172033]">{MESES[h.mes - 1]} {h.anio}</td>
                        <td className="px-3 py-2 text-slate-500">{h.monto ? `Bs ${formatMonto(h.monto)}` : '—'}</td>
                        <td className="px-3 py-2">
                          <span className={getEstadoBadge(h.estado)}>{getLabelEstado(h.estado)}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{h.fecha_pago ? formatDate(h.fecha_pago) : '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{h.metodo_pago || '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{h.registrado_por_nombre || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowHistorialModal(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-[#172033] border border-gray-300 rounded-lg">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    <ReportPDFPreview open={previewOpen} onClose={() => setPreviewOpen(false)} doc={docPreview} />
    </>
  );
}

export default RecepcionPagos;
