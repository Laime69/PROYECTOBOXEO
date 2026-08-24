import { useState, useEffect } from 'react';
import { getResumenPagos } from '../../services/reporteService';
import { getPagos } from '../../services/pagoService';
import { imprimirDocumento } from '../../utils/printReport';

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

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ESTADO_LABELS = { pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido' };
const ESTADO_STYLES = {
  pagado: 'bg-green-100 text-green-800',
  pendiente: 'bg-yellow-100 text-yellow-800',
  vencido: 'bg-red-100 text-red-800',
};

function RecepcionReportes() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [resumen, setResumen] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resumenData, pagosData] = await Promise.all([
          getResumenPagos({ mes, anio }),
          getPagos({ mes, anio }),
        ]);
        setResumen(resumenData.resumen);
        setPagos(pagosData.pagos || []);
      } catch {
        setError('Error al cargar el reporte');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mes, anio]);

  const handleImprimir = () => {
    imprimirDocumento({
      titulo: `Reporte Mensual de Pagos — ${MESES[mes - 1]} ${anio}`,
      periodo: `Período: ${MESES[mes - 1]} ${anio}`,
      resumen: [
        { etiqueta: 'Total Alumnos', valor: resumen?.total_alumnos ?? '—' },
        { etiqueta: 'Pagados', valor: resumen?.pagados_mes ?? '—', color: '#15803d' },
        { etiqueta: 'Pendientes', valor: resumen?.pendientes_mes ?? '—', color: '#b45309' },
        { etiqueta: 'Vencidos', valor: resumen?.vencidos ?? '—', color: '#b91c1c' },
        { etiqueta: 'Ingresos', valor: `$${formatMonto(resumen?.ingresos_mes)}` },
      ],
      secciones: [
        {
          titulo: 'Detalle por alumno',
          columnas: ['Alumno', 'Turno', 'Estado', 'Monto', 'Fecha Pago', 'Vencimiento'],
          filas: pagos.map((p) => [
            p.alumno_nombre,
            p.turno ? NOMBRES_TURNO[p.turno] || p.turno : '—',
            ESTADO_LABELS[p.estado] || p.estado,
            p.estado === 'pagado' ? `$${formatMonto(p.monto)}` : '—',
            p.estado === 'pagado' ? formatDate(p.fecha_pago) : '—',
            formatDate(p.fecha_vencimiento),
          ]),
        },
      ],
    });
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reportes de Pagos</h2>
          <p className="text-gray-500 mt-1">Reporte mensual para impresión</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            {MESES.map((label, idx) => (
              <option key={idx + 1} value={idx + 1}>{label}</option>
            ))}
          </select>
          <select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            {ANIOS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            onClick={handleImprimir}
            className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Imprimir Reporte
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {resumen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">Total Alumnos</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{resumen.total_alumnos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">Pagados del Mes</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{resumen.pagados_mes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">Pendientes</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{resumen.pendientes_mes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">Vencidos</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{resumen.vencidos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">Ingresos del Mes</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">${formatMonto(resumen.ingresos_mes)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Vista previa: {MESES[mes - 1]} {anio}
          </h3>
          <span className="text-xs text-gray-400">{pagos.length} alumnos</span>
        </div>
        {pagos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay datos para este período</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Alumno</th>
                  <th className="px-4 py-3 font-medium">Turno</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Monto</th>
                  <th className="px-4 py-3 font-medium">Fecha Pago</th>
                  <th className="px-4 py-3 font-medium">Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={`${p.alumno_id}_${p.mes}_${p.anio}`} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.alumno_nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.turno ? NOMBRES_TURNO[p.turno] || p.turno : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_STYLES[p.estado] || 'bg-gray-100 text-gray-800'}`}>
                        {ESTADO_LABELS[p.estado] || p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                      {p.estado === 'pagado' ? `$${formatMonto(p.monto)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.estado === 'pagado' ? formatDate(p.fecha_pago) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(p.fecha_vencimiento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecepcionReportes;
