import { useState, useEffect } from 'react';
import { getMiEstadoPago } from '../../services/alumnoService';
import { getHistorialAlumno } from '../../services/pagoService';
import { useAuth } from '../../context/AuthContext';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

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
    if (!user?.id_usuario) return;
    const fetchHistorial = async () => {
      try {
        const data = await getHistorialAlumno(user.id_usuario);
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

  const getPagoBadge = (estado) => {
    const styles = {
      pagado: 'bg-green-100 text-green-800',
      pendiente: 'bg-amber-100 text-amber-800',
      vencido: 'bg-red-100 text-red-800',
    };
    const label = estado === 'pagado' ? 'Pagado' : estado === 'vencido' ? 'Vencido' : 'Pendiente';
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[estado] || 'bg-gray-100 text-[#172033]'}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#172033]">Estado de Pago</h2>
        <p className="text-slate-500 mt-1">Información de tu membresía</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
          <p className="text-sm text-slate-500 font-medium">Estado Actual</p>
          <div className="mt-2">{pago ? getPagoBadge(pago.estado_pago) : '—'}</div>
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

      {pago && pago.estado_pago === 'vencido' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 mb-6">
          Tu membresía está <strong>vencida</strong>. Acércate a recepción para regularizar tu situación.
        </div>
      )}
      {pago && pago.estado_pago === 'pendiente' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-6">
          Tu membresía está <strong>pendiente de pago</strong>. Recuerda pagar tu mensualidad en recepción.
        </div>
      )}
      {pago && pago.estado_pago === 'pagado' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 mb-6">
          Tu membresía está <strong>al día</strong>. Gracias por tu puntualidad.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-[#172033]">Historial de Pagos</h3>
        </div>
        {historialLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : historial.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No hay historial de pagos</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                  <th className="px-6 py-3 font-medium">Mes</th>
                  <th className="px-6 py-3 font-medium">Monto</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Fecha de Pago</th>
                  <th className="px-6 py-3 font-medium">Método</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-[#172033]">{MESES[h.mes - 1]} {h.anio}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{h.monto ? `Bs ${Number(h.monto).toFixed(2)}` : '—'}</td>
                    <td className="px-6 py-3">{getPagoBadge(h.estado)}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{h.fecha_pago ? formatDate(h.fecha_pago) : '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{h.metodo_pago || '—'}</td>
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

export default Pago;
