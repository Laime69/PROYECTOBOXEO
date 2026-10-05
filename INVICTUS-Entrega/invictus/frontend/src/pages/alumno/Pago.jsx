import { useState, useEffect, useMemo } from 'react';
import { getMiEstadoPago } from '../../services/alumnoService';
import { getHistorialAlumno } from '../../services/pagoService';
import { useAuth } from '../../context/AuthContext';
import CabeceraPagina from '../../components/CabeceraPagina';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CONFIG_ESTADOS = {
  pagado: { label: 'Pagado', dot: 'bg-green-500', badge: 'bg-green-100 text-green-800' },
  pendiente: { label: 'Pendiente', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-800' },
  vencido: { label: 'Vencido', dot: 'bg-red-500', badge: 'bg-red-100 text-red-800' },
};

function Pago() {
  const { user } = useAuth();
  const [pago, setPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMiEstadoPago();
        setPago(data.pago);
      } catch {
        setError('Error al cargar estado de pago');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const alumnoId = user?.id_usuario ?? user?.id;
    if (!alumnoId) return;
    const fetchHistorial = async () => {
      try {
        const data = await getHistorialAlumno(alumnoId);
        setHistorial(data.historial || []);
      } catch {
      } finally {
        setHistorialLoading(false);
      }
    };
    fetchHistorial();
  }, [user]);

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const resumen = useMemo(() => {
    const totalPagado = historial
      .filter((h) => h.estado === 'pagado' && h.monto != null)
      .reduce((acc, h) => acc + Number(h.monto), 0);
    const alDia = historial.filter((h) => h.estado === 'pagado').length;
    const adeudados = historial.filter((h) => h.estado === 'pendiente' || h.estado === 'vencido').length;
    return {
      totalPagado,
      alDia,
      adeudados,
      porcentajeAldia: historial.length > 0 ? Math.round((alDia / historial.length) * 100) : 0,
    };
  }, [historial]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
      </div>
    );
  }

  const estadosAlertas = {
    vencido: {
      clase: 'bg-red-50 border-red-200 text-red-800',
      texto: () => (<>Tu membresía está <strong>vencida</strong>. Acércate a recepción para regularizar tu situación.</>),
    },
    pendiente: {
      clase: 'bg-amber-50 border-amber-200 text-amber-800',
      texto: () => (<>Tu membresía está <strong>pendiente de pago</strong>. Recuerda pagar tu mensualidad en recepción.</>),
    },
    pagado: {
      clase: 'bg-green-50 border-green-200 text-green-800',
      texto: () => (<>Tu membresía está <strong>al día</strong>. Gracias por tu puntualidad.</>),
    },
  };

  const historialDesc = [...historial].sort((a, b) => (b.anio - a.anio) || (b.mes - a.mes));

  return (
    <div>
      <CabeceraPagina
        titulo="Estado de Pago"
        subtitulo="Información de tu membresía"
        stats={[
          { valor: `${resumen.porcentajeAldia}%`, etiqueta: 'al día', color: resumen.porcentajeAldia >= 70 ? 'text-green-600' : resumen.porcentajeAldia > 0 ? 'text-amber-500' : 'text-red-600' },
          { valor: `${resumen.totalPagado.toFixed(2)} Bs`, etiqueta: 'total pagado', color: 'text-[#172033]' },
          { valor: resumen.alDia, etiqueta: 'meses pagados', color: 'text-green-600' },
          { valor: resumen.adeudados, etiqueta: 'meses adeudados', color: resumen.adeudados > 0 ? 'text-red-600' : 'text-slate-500' },
        ]}
      />

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
          <p className="text-sm text-slate-500 font-medium">Estado Actual</p>
          <div className="mt-2">{pago ? getBadgeEstado(pago.estado_pago) : '—'}</div>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
          <p className="text-sm text-slate-500 font-medium">Fecha de Inscripción</p>
          <p className="text-xl font-bold text-[#172033] mt-1">{pago ? formatDate(pago.fecha_inscripcion) : '—'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
          <p className="text-sm text-slate-500 font-medium">Fecha de Vencimiento</p>
          <p className="text-xl font-bold text-[#172033] mt-1">{pago ? formatDate(pago.fecha_vencimiento) : '—'}</p>
        </div>
      </div>

      {pago && estadosAlertas[pago.estado_pago] && (
        <div className={`border rounded-xl p-4 text-sm mb-6 ${estadosAlertas[pago.estado_pago].clase}`}>
          {estadosAlertas[pago.estado_pago].texto()}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-[#172033]">Historial de Pagos</h3>
            <p className="text-xs text-slate-400 mt-0.5">Mensualidades de tu membresía (últimos 12 meses)</p>
          </div>
          {resumen.totalPagado > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs">
                <strong className="text-green-700">{resumen.totalPagado.toFixed(2)} Bs</strong>
                <span className="text-green-600">cancelados</span>
              </span>
            </div>
          )}
        </div>

        {historialLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : historial.length === 0 ? (
          <div className="text-center py-10 px-6">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h2m4 0h2m-8 5h8a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v11a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-500 font-medium">Aún no tienes historial de pagos</p>
            <p className="text-sm text-slate-400 mt-1">Tu primera mensualidad aparecerá aquí cuando la canceles en recepción.</p>
          </div>
        ) : (
          <div className="p-6 pt-5">
            <div className="relative pl-6">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
              {historialDesc.map((h, idx) => {
                const cfg = CONFIG_ESTADOS[h.estado] || { label: h.estado, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' };
                const esPagado = h.estado === 'pagado';
                return (
                  <div key={idx} className="relative pb-5 last:pb-0">
                    <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm bg-white">
                      <span className={`absolute inset-0 m-auto w-2 h-2 rounded-full ${cfg.dot}`} />
                    </span>
                    <div className={`rounded-xl border p-4 transition-colors ${esPagado ? 'border-green-200 bg-green-50/40' : 'border-gray-200 bg-white'} hover:shadow-card`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#172033]">{MESES[h.mes - 1]} {h.anio}</p>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-[#172033]">
                          {h.monto != null ? `Bs ${Number(h.monto).toFixed(2)}` : `Bs 200.00`}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-slate-500">
                        {esPagado && h.fecha_pago && (
                          <span><strong className="text-slate-600">Pagado el:</strong> {formatDate(h.fecha_pago)}</span>
                        )}
                        {esPagado && h.metodo_pago && (
                          <span><strong className="text-slate-600">Método:</strong> {h.metodo_pago}</span>
                        )}
                        {esPagado && h.registrado_por_nombre && (
                          <span><strong className="text-slate-600">Registrado por:</strong> {h.registrado_por_nombre}</span>
                        )}
                        {!esPagado && (
                          <span>Cancelar tu mensualidad en recepción para ponerte al día.</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getBadgeEstado(estado) {
  const cfg = CONFIG_ESTADOS[estado] || { label: estado, badge: 'bg-gray-100 text-[#172033]' };
  return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.badge}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot || 'bg-gray-400'}`} />
    {cfg.label}
  </span>;
}

export default Pago;