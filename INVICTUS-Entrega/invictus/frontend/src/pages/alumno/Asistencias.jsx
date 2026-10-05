import { useState, useEffect, useMemo } from 'react';
import { getMisAsistencias } from '../../services/alumnoService';
import CabeceraPagina from '../../components/CabeceraPagina';

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const CONFIG_ESTADOS = {
  presente: { label: 'Presente', dot: 'bg-green-500', badge: 'bg-green-100 text-green-800' },
  falta: { label: 'Falta', dot: 'bg-red-500', badge: 'bg-red-100 text-red-800' },
  permiso: { label: 'Permiso', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-800' },
};

const pad = (n) => String(n).padStart(2, '0');

function Asistencias() {
  const today = new Date();
  const [anio, setAnio] = useState(today.getFullYear());
  const [mes, setMes] = useState(today.getMonth());
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const fechaInicio = `${anio}-${pad(mes + 1)}-01`;
  const fechaFin = `${anio}-${pad(mes + 1)}-${pad(ultimoDia)}`;

  const fetchAsistencias = async () => {
    setLoading(true);
    try {
      const data = await getMisAsistencias({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      setAsistencias(data.asistencias || []);
      setError('');
    } catch {
      setError('Error al cargar tus asistencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAsistencias(); }, [mes, anio]);

  const navegar = (delta) => {
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio -= 1; }
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio += 1; }
    if (nuevoMes > today.getMonth() && nuevoAnio >= today.getFullYear()) return;
    if (nuevoAnio > today.getFullYear()) return;
    setMes(nuevoMes);
    setAnio(nuevoAnio);
  };

  const resumen = useMemo(() => {
    const total = asistencias.length;
    const presentes = asistencias.filter((a) => a.estado === 'presente').length;
    const faltas = asistencias.filter((a) => a.estado === 'falta').length;
    const permisos = asistencias.filter((a) => a.estado === 'permiso').length;
    const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

    const ordenadas = [...asistencias].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    let racha = 0;
    for (let i = ordenadas.length - 1; i >= 0; i--) {
      if (ordenadas[i].estado === 'presente') racha++;
      else break;
    }

    return { total, presentes, faltas, permisos, porcentaje, racha };
  }, [asistencias]);

  const mapaPorFecha = useMemo(() => {
    const mapa = {};
    asistencias.forEach((a) => {
      const clave = String(a.fecha).slice(0, 10);
      if (!mapa[clave]) mapa[clave] = [];
      mapa[clave].push(a);
    });
    return mapa;
  }, [asistencias]);

  const primerDiaMes = new Date(anio, mes, 1).getDay();
  const celdasPrevias = (primerDiaMes + 6) % 7;
  const celdasFuturas = (7 - ((celdasPrevias + ultimoDia) % 7)) % 7;
  const celdas = [
    ...Array.from({ length: celdasPrevias }, () => null),
    ...Array.from({ length: ultimoDia }, (_, i) => i + 1),
    ...Array.from({ length: celdasFuturas }, () => null),
  ];

  const getEstadoDeDia = (dia) => {
    const clave = `${anio}-${pad(mes + 1)}-${pad(dia)}`;
    const registros = mapaPorFecha[clave];
    if (!registros || registros.length === 0) return null;
    if (registros.some((r) => r.estado === 'presente')) return 'presente';
    if (registros.some((r) => r.estado === 'falta')) return 'falta';
    return 'permiso';
  };

  const esMesActual = anio === today.getFullYear() && mes === today.getMonth();

  const stats = [
    { valor: resumen.total, etiqueta: 'registros', color: 'text-[#172033]' },
    { valor: resumen.presentes, etiqueta: 'presentes', color: 'text-green-600' },
    { valor: resumen.faltas, etiqueta: 'faltas', color: 'text-red-600' },
    { valor: resumen.permisos, etiqueta: 'permisos', color: 'text-amber-600' },
  ];

  return (
    <div>
      <CabeceraPagina
        titulo="Mis Asistencias"
        subtitulo={`Seguimiento de tu asistencia · ${NOMBRES_MESES[mes]} ${anio}`}
        stats={stats}
      />

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Selector de mes */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-card border border-gray-200/70 px-4 py-3 mb-5">
        <button
          onClick={() => navegar(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-[#172033] hover:bg-invictus-50 transition-colors"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-[#172033]">{NOMBRES_MESES[mes]} {anio}</p>
          {!esMesActual && (
            <button
              onClick={() => { setMes(today.getMonth()); setAnio(today.getFullYear()); }}
              className="text-xs text-invictus-600 hover:underline"
            >
              Volver al mes actual
            </button>
          )}
        </div>
        <button
          onClick={() => navegar(1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-[#172033] hover:bg-invictus-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Mes siguiente"
          disabled={esMesActual}
        >
          ›
        </button>
      </div>

      {/* Tarjetas de seguimiento */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 p-4">
          <p className="text-xs font-medium text-slate-500">Asistencia del mes</p>
          <p className="mt-1 flex items-end gap-1">
            <span className="text-2xl font-bold text-[#172033]">{resumen.porcentaje}%</span>
          </p>
          <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${resumen.porcentaje >= 70 ? 'bg-green-500' : resumen.porcentaje >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
              style={{ width: `${resumen.porcentaje}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 p-4">
          <p className="text-xs font-medium text-slate-500">Días presentes</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{resumen.presentes}</p>
          <p className="text-xs text-slate-400 mt-1">de {resumen.total} registros</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 p-4">
          <p className="text-xs font-medium text-slate-500">Faltas</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{resumen.faltas}</p>
          <p className="text-xs text-slate-400 mt-1">ausencias sin justificación</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 p-4">
          <p className="text-xs font-medium text-slate-500">Permisos</p>
          <p className="mt-1 text-2xl font-bold text-amber-500">{resumen.permisos}</p>
          <p className="text-xs text-slate-400 mt-1">ausencias justificadas</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 p-4">
          <p className="text-xs font-medium text-slate-500">Racha actual</p>
          <p className="mt-1 text-2xl font-bold text-invictus-600">
            {resumen.racha} <span className="text-sm font-medium text-slate-400">días</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">entrenando de corrido</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 p-4">
          <p className="text-xs font-medium text-slate-500">Registros del período</p>
          <p className="mt-1 text-2xl font-bold text-[#172033]">{resumen.total}</p>
          <p className="text-xs text-slate-400 mt-1">{NOMBRES_MESES[mes]} {anio}</p>
        </div>
      </div>

      {/* Calendario + detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card border border-gray-200/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#172033]">Resumen del mes</h3>
          </div>
          <div className="mb-3 grid grid-cols-7 gap-1 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
              <span key={i} className="text-[10px] font-semibold text-slate-400 uppercase">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celdas.map((dia, idx) => {
              if (dia === null) return <div key={idx} className="aspect-square" />;
              const estado = getEstadoDeDia(dia);
              const esHoy = anio === today.getFullYear() && mes === today.getMonth() && dia === today.getDate();
              const esRegistro = Boolean(estado);
              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                    esRegistro
                      ? CONFIG_ESTADOS[estado].badge
                      : 'text-slate-400 bg-gray-50/60 hover:bg-gray-100'
                  } ${esHoy ? 'ring-2 ring-invictus-600 ring-offset-1' : ''}`}
                >
                  {dia}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            {Object.entries(CONFIG_ESTADOS).map(([key, cfg]) => (
              <span key={key} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full border border-gray-300 bg-white" />
              Sin registro
            </span>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl shadow-card border border-gray-200/70 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-[#172033]">Detalle de asistencias</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
            </div>
          ) : asistencias.length === 0 ? (
            <div className="text-center py-14 px-6">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-500 font-medium">No hay asistencias registradas este mes</p>
              <p className="text-sm text-slate-400 mt-1">Tus entrenamientos aparecerán aquí cuando el entrenador registre tu asistencia.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200">
                    <th className="px-5 py-3 font-semibold">Fecha</th>
                    <th className="px-5 py-3 font-semibold">Estado</th>
                    <th className="px-5 py-3 font-semibold">Entrenador</th>
                    <th className="px-5 py-3 font-semibold">Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.map((a) => {
                    const fecha = new Date(a.fecha);
                    const cfg = CONFIG_ESTADOS[a.estado] || { label: a.estado, badge: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={a.id_asistencia} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-[#172033]">
                            {fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-400">{NOMBRES_DIAS[fecha.getDay()]}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${CONFIG_ESTADOS[a.estado]?.dot || 'bg-gray-400'}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-500">{a.entrenador_nombre || '—'}</td>
                        <td className="px-5 py-3 text-sm text-slate-500 max-w-[220px] truncate">{a.observacion || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Asistencias;