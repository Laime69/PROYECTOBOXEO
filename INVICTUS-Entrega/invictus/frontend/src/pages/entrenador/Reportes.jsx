import { useState, useEffect, useCallback } from 'react';
import { useTituloPagina } from '../../hooks/useTituloPagina';
import { getAsistenciasEntrenador } from '../../services/reporteService';
import { getAsistencias } from '../../services/asistenciaService';
import { getUsers } from '../../services/usuarioService';
import ReportPDFPreview from '../../components/ReportPDFPreview';
import Paginacion from '../../components/Paginacion';
import CabeceraPagina from '../../components/CabeceraPagina';
import AutocompleteUsuario from '../../components/AutocompleteUsuario';

const ESTADOS_ASISTENCIA = ['presente', 'falta', 'tardanza', 'justificado', 'permiso'];
const ESTADO_LABELS = {
  presente: 'Presente', falta: 'Falta', tardanza: 'Tardanza', justificado: 'Justificado', permiso: 'Permiso',
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(String(date).length === 10 ? `${date}T12:00:00` : date).toLocaleDateString('es-ES');
};

const hoyIso = () => new Date().toISOString().slice(0, 10);
const inicioMesIso = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

function EntrenadorReportes() {
  useTituloPagina('Mis Reportes');
  const [resumen, setResumen] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fechaInicio, setFechaInicio] = useState(inicioMesIso());
  const [fechaFin, setFechaFin] = useState(hoyIso());
  const [estado, setEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [alumnos, setAlumnos] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const visibles = detalle.slice((pagina - 1) * porPagina, pagina * porPagina);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filtrosDetalle = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
      if (estado) filtrosDetalle.estado = estado;
      if (busqueda.trim()) filtrosDetalle.busqueda = busqueda.trim();

      const [resumenData, detalleData] = await Promise.all([
        getAsistenciasEntrenador(fechaInicio, fechaFin),
        getAsistencias(filtrosDetalle),
      ]);
      setResumen(resumenData.datos);
      setDetalle(detalleData.asistencias || []);
      setPagina(1);
    } catch {
      setError('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, estado, busqueda]);

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

  const periodoTexto = `Período: ${formatDate(fechaInicio)} al ${formatDate(fechaFin)}`;

  const construirDoc = () => ({
    titulo: 'Reporte de Asistencias del Entrenador',
    periodo: periodoTexto,
    generadoPor: JSON.parse(localStorage.getItem('user') || '{}')?.nombre,
    filtros: [
      { etiqueta: 'Desde', valor: formatDate(fechaInicio) },
      { etiqueta: 'Hasta', valor: formatDate(fechaFin) },
      { etiqueta: 'Estado', valor: estado ? ESTADO_LABELS[estado] : 'Todos' },
      { etiqueta: 'Búsqueda', valor: busqueda.trim() || '—' },
    ],
    resumen: [
      { etiqueta: 'Total', valor: resumen?.total ?? 0 },
      { etiqueta: 'Presentes', valor: resumen?.presentes ?? 0, color: '#15803d' },
      { etiqueta: 'Faltas', valor: resumen?.faltas ?? 0, color: '#b91c1c' },
      { etiqueta: 'Permisos', valor: resumen?.permisos ?? 0, color: '#b45309' },
    ],
    secciones: [
      {
        titulo: 'Resumen por estado',
        columnas: ['Concepto', 'Cantidad'],
        filas: [
          ['Total de registros en el período', resumen?.total ?? 0],
          ['Presentes', resumen?.presentes ?? 0],
          ['Faltas', resumen?.faltas ?? 0],
          ['Tardanzas', resumen?.tardanzas ?? 0],
          ['Justificados', resumen?.justificados ?? 0],
          ['Permisos', resumen?.permisos ?? 0],
        ],
      },
      {
        titulo: 'Detalle de asistencia',
        nota: 'Elaboración propia a partir de los registros del módulo de asistencias.',
        columnas: ['#', 'Fecha', 'Alumno', 'Entrenador', 'Estado', 'Observación'],
        filas: detalle.map((f, i) => [
          i + 1,
          formatDate(f.fecha),
          f.alumno_nombre || '—',
          f.entrenador_nombre || '—',
          ESTADO_LABELS[f.estado] || f.estado,
          f.observacion || '—',
        ]),
      },
    ],
  });

  const cards = [
    { borde: 'border-l-blue-500', label: 'Total Asistencias', value: resumen?.total || 0, color: 'text-blue-600' },
    { borde: 'border-l-green-500', label: 'Presentes', value: resumen?.presentes || 0, color: 'text-green-600' },
    { borde: 'border-l-red-500', label: 'Faltas', value: resumen?.faltas || 0, color: resumen?.faltas > 0 ? 'text-red-600' : 'text-slate-500' },
    { borde: 'border-l-amber-500', label: 'Permisos', value: resumen?.permisos || 0, color: 'text-amber-600' },
  ];

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
        titulo="Reporte de Asistencias"
        subtitulo="Resumen y detalle de tus asistencias registradas"
        acciones={
          <button onClick={() => setPreviewOpen(true)}
            className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-5.414-5.414A2 2 0 0011.586 2H7a2 2 0 00-2 2v15a2 2 0 002 2z" /></svg>
            Vista previa PDF
          </button>
        }
      />

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
            <select value={estado} onChange={(e) => setEstado(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
              <option value="">Todos</option>
              {ESTADOS_ASISTENCIA.map((e) => (
                <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {cards.map((c) => (
          <div key={c.label} className={`bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 border-l-4 ${c.borde || ""} p-6`}>
            <p className="text-sm text-slate-500 font-medium">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Detalle ({periodoTexto.replace('Período: ', '')})</h3>
          <span className="text-xs text-gray-400">{detalle.length} registros</span>
        </div>
        {detalle.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No hay registros con los filtros aplicados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
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
                {visibles.map((f, idx) => (
                  <tr key={f.id_asistencia || idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-400">{(pagina - 1) * porPagina + idx + 1}</td>
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
                        {ESTADO_LABELS[f.estado] || f.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{f.observacion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {detalle.length > 0 && (
          <Paginacion total={detalle.length} pagina={pagina} porPagina={porPagina}
            setPagina={setPagina} setPorPagina={setPorPagina} />
        )}
      </div>

      {resumen && resumen.presentes > 0 && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          Registraste <strong>{resumen.presentes}</strong> asistencia{resumen.presentes !== 1 ? 's' : ''} como presente{resumen.presentes !== 1 ? 's' : ''} en este período.
        </div>
      )}

      <ReportPDFPreview open={previewOpen} onClose={() => setPreviewOpen(false)} doc={construirDoc()} />
    </div>
  );
}

export default EntrenadorReportes;
