import { useState, useEffect, useCallback } from 'react';
import { useTituloPagina } from '../../hooks/useTituloPagina';
import { getReportePagos } from '../../services/reporteService';
import { getUsers } from '../../services/usuarioService';
import ReportPDFPreview from '../../components/ReportPDFPreview';
import Paginacion from '../../components/Paginacion';
import CabeceraPagina from '../../components/CabeceraPagina';
import AutocompleteUsuario from '../../components/AutocompleteUsuario';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const ANIOS = [2024, 2025, 2026, 2027];
const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };
const ESTADOS_PAGO = ['pagado', 'pendiente', 'vencido'];
const ESTADO_LABELS = { pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido' };

const formatMonto = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero.toFixed(2) : '0.00';
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(String(date).length === 10 ? `${date}T12:00:00` : date).toLocaleDateString('es-ES');
};

function RecepcionReportes() {
  useTituloPagina('Reportes de Pagos');
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [estado, setEstado] = useState('');
  const [turno, setTurno] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [alumnos, setAlumnos] = useState([]);
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [docPreview, setDocPreview] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const filas = datos?.filas || [];
  const visibles = filas.slice((pagina - 1) * porPagina, pagina * porPagina);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { mes, anio };
      if (estado) params.estado = estado;
      if (turno) params.turno = turno;
      if (busqueda.trim()) params.busqueda = busqueda.trim();
      const data = await getReportePagos(params);
      setDatos(data.datos);
      setPagina(1);
    } catch {
      setError('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  }, [mes, anio, estado, turno, busqueda]);

  useEffect(() => {
    const t = setTimeout(() => cargar(), 350);
    return () => clearTimeout(t);
  }, [cargar]);

  useEffect(() => {
    const cargarAlumnos = async () => {
      try {
        const data = await getUsers('Alumno');
        setAlumnos(data.usuarios || []);
      } catch {}
    };
    cargarAlumnos();
  }, []);

  const construirDoc = () => ({
    titulo: `Reporte Mensual de Pagos — ${MESES[mes - 1]} ${anio}`,
    periodo: `Período: ${MESES[mes - 1]} ${anio}`,
    generadoPor: JSON.parse(localStorage.getItem('user') || '{}')?.nombre,
    filtros: [
      { etiqueta: 'Mes', valor: MESES[mes - 1] },
      { etiqueta: 'Año', valor: anio },
      { etiqueta: 'Estado', valor: estado ? ESTADO_LABELS[estado] : 'Todos' },
      { etiqueta: 'Turno', valor: turno ? NOMBRES_TURNO[turno] : 'Todos' },
      { etiqueta: 'Búsqueda', valor: busqueda.trim() || '—' },
    ],
    resumen: [
      { etiqueta: 'Total Alumnos', valor: datos?.resumen?.total_alumnos ?? '—' },
      { etiqueta: 'Pagados', valor: datos?.filtros_aplicados?.pagados ?? 0, color: '#15803d' },
      { etiqueta: 'Pendientes', valor: datos?.filtros_aplicados?.pendientes ?? 0, color: '#b45309' },
      { etiqueta: 'Vencidos', valor: datos?.filtros_aplicados?.vencidos ?? 0, color: '#b91c1c' },
      { etiqueta: 'Ingresos Bs.', valor: formatMonto(datos?.filtros_aplicados?.ingresos) },
    ],
    secciones: [
      {
        titulo: 'Detalle por alumno',
        nota: 'Elaboración propia a partir de los registros del módulo de pagos.',
        columnas: ['#', 'Alumno', 'Turno', 'Estado', 'Monto', 'Fecha Pago', 'Vencimiento'],
        filas: (datos?.filas || []).map((p, i) => [
          i + 1,
          p.alumno_nombre,
          p.turno ? NOMBRES_TURNO[p.turno] || p.turno : '—',
          ESTADO_LABELS[p.estado_pago] || p.estado_pago || '—',
          p.estado_pago === 'pagado' ? `Bs ${formatMonto(p.monto)}` : '—',
          p.estado_pago === 'pagado' ? formatDate(p.fecha_pago) : '—',
          formatDate(p.fecha_vencimiento),
        ]),
      },
    ],
  });

  const abrirPreview = () => {
    setDocPreview(construirDoc());
    setPreviewOpen(true);
  };

  if (loading && !datos) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <CabeceraPagina
        titulo="Reportes de Pagos"
        subtitulo="Reporte mensual con vista previa PDF para impresión"
        acciones={
          <button onClick={abrirPreview}
            className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-5.414-5.414A2 2 0 0011.586 2H7a2 2 0 00-2 2v15a2 2 0 002 2z" /></svg>
            Vista previa PDF
          </button>
        }
      />

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Mes</label>
            <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
              {MESES.map((label, idx) => (
                <option key={idx + 1} value={idx + 1}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Año</label>
            <select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
              {ANIOS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
              <option value="">Todos</option>
              {ESTADOS_PAGO.map((e) => (
                <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Turno</label>
            <select value={turno} onChange={(e) => setTurno(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
              <option value="">Todos</option>
              {Object.entries(NOMBRES_TURNO).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-slate-500 mb-1">Buscar alumno</label>
            <AutocompleteUsuario
              texto={busqueda}
              onTexto={setBusqueda}
              alumnos={alumnos}
              onSubmit={cargar}
              placeholder="Nombre, correo o CI..."
            />
          </div>
          {loading && <span className="text-xs text-slate-500 ml-auto py-1">Actualizando…</span>}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {datos && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {[
              { borde: 'border-l-blue-500', label: 'Alumnos listados', value: datos.filas.length, color: 'text-[#172033]' },
              { borde: 'border-l-green-500', label: 'Pagados', value: datos.filtros_aplicados.pagados, color: 'text-green-600' },
              { borde: 'border-l-amber-500', label: 'Pendientes', value: datos.filtros_aplicados.pendientes, color: 'text-amber-600' },
              { borde: 'border-l-red-500', label: 'Vencidos', value: datos.filtros_aplicados.vencidos, color: 'text-red-600' },
              { borde: 'border-l-violet-500', label: 'Ingresos Bs.', value: formatMonto(datos.filtros_aplicados.ingresos), color: 'text-indigo-600' },
            ].map((c) => (
              <div key={c.label} className={`bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 ${c.borde || ""} p-4 text-center`}>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-slate-500 font-medium">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Vista previa: {MESES[mes - 1]} {anio}</h3>
              <span className="text-xs text-gray-400">{datos.filas.length} alumnos</span>
            </div>
            {datos.filas.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No hay datos para este período o filtros</div>
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
                    {visibles.map((p, idx) => (
                      <tr key={`${p.alumno_id}_${p.mes}_${p.anio}`} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-400">{(pagina - 1) * porPagina + idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#172033]">{p.alumno_nombre}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{p.turno ? NOMBRES_TURNO[p.turno] || p.turno : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.estado_pago === 'pagado' ? 'bg-green-100 text-green-800'
                              : p.estado_pago === 'vencido' ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ESTADO_LABELS[p.estado_pago] || p.estado_pago}
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
                {filas.length > 0 && (
                  <Paginacion total={filas.length} pagina={pagina} porPagina={porPagina}
                    setPagina={setPagina} setPorPagina={setPorPagina} />
                )}
          </div>
        </>
      )}

      <ReportPDFPreview open={previewOpen} onClose={() => setPreviewOpen(false)} doc={docPreview} />
    </div>
  );
}

export default RecepcionReportes;
