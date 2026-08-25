import { useState, useEffect } from 'react';
import { useTituloPagina } from '../../hooks/useTituloPagina';
import { getUsers, updateUser } from '../../services/usuarioService';
import { getHorarioActual } from '../../services/alumnoHorarioService';
import UserDetailModal from '../../components/UserDetailModal';
import ActionButton from '../../components/ActionButton';
import CabeceraPagina from '../../components/CabeceraPagina';

const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

const ESTADOS_PAGO = ['', 'pagado', 'pendiente', 'vencido'];
const ESTADO_PAGO_LABELS = { pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido' };

function Alumnos() {
  useTituloPagina('Alumnos');
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewUserId, setViewUserId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');

  useEffect(() => {
    if (!error) return undefined;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!success) return undefined;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  // autodismiss-ok
  const fetchAlumnos = async () => {
    setLoading(true);
    try {
      const data = await getUsers('Alumno');
      const alumnosConHorario = await Promise.all(
        data.usuarios.map(async (a) => {
          try {
            const res = await getHorarioActual(a.id_usuario);
            return { ...a, horario_asignado: res.horario };
          } catch {
            return { ...a, horario_asignado: null };
          }
        })
      );
      setAlumnos(alumnosConHorario);
    } catch {
      setError('Error al cargar alumnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumnos();
  }, []);

  const getTurnoKey = (asignacion) => {
    if (!asignacion) return '';
    return asignacion.turno || asignacion.turno_horario || '';
  };

  const alumnosFiltrados = alumnos.filter((a) => {
    if (filtroEstadoPago && a.estado_pago !== filtroEstadoPago) return false;
    if (filtroTurno && getTurnoKey(a.horario_asignado) !== filtroTurno) return false;
    if (busqueda.trim()) {
      const term = busqueda.trim().toLowerCase();
      const texto = `${a.nombre || ''} ${a.correo || ''} ${a.ci || ''} ${a.celular || ''}`.toLowerCase();
      if (!texto.includes(term)) return false;
    }
    return true;
  });

  const handleQuickPay = async (alumno) => {
    try {
      const hoy = new Date();
      const vencimiento = new Date(hoy);
      vencimiento.setDate(vencimiento.getDate() + 30);
      await updateUser(alumno.id_usuario, {
        estado_pago: 'pagado',
        fecha_inscripcion: hoy.toISOString().slice(0, 10),
        fecha_vencimiento: vencimiento.toISOString().slice(0, 10),
      });
      setSuccess(`Pago registrado: ${alumno.nombre}`);
      fetchAlumnos();
    } catch {
      setError('Error al actualizar pago');
    }
  };

  const getPagoBadge = (estado) => {
    const styles = {
      pagado: 'bg-green-100 text-green-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      vencido: 'bg-red-100 text-red-800',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-[#172033]'}`;
  };

  const getTurnoLabel = (asignacion) => {
    if (!asignacion) return '—';
    const turno = asignacion.turno || asignacion.turno_horario;
    if (turno && NOMBRES_TURNO[turno]) return NOMBRES_TURNO[turno];
    return asignacion.nombre_turno || '—';
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  return (
    <div>
      <CabeceraPagina
        titulo="Alumnos"
        subtitulo="Padrón de deportistas registrados en la academia"
        stats={[
          { valor: alumnos.length, etiqueta: 'alumnos', color: 'text-[#172033]' },
          { valor: alumnos.filter((a) => a.estado === 'activo').length, etiqueta: 'activos', color: 'text-green-600' },
          { valor: alumnos.filter((a) => a.estado_pago === 'pagado').length, etiqueta: 'al día', color: 'text-emerald-600' },
          { valor: alumnos.filter((a) => a.estado_pago === 'pendiente').length, etiqueta: 'pendientes', color: 'text-amber-600' },
        ]}
      />

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      {/* ── Barra de filtros ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4 mb-5">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <div className="flex-1 min-w-[230px]">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Buscar alumno</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, correo, CI o celular..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Estado de pago</label>
            <select value={filtroEstadoPago} onChange={(e) => setFiltroEstadoPago(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500 ${filtroEstadoPago ? 'border-invictus-400 text-invictus-700 font-medium' : 'border-gray-300'}`}>
              <option value="">Todos</option>
              {ESTADOS_PAGO.filter(Boolean).map((est) => (
                <option key={est} value={est}>{ESTADO_PAGO_LABELS[est]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Turno</label>
            <select value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500 ${filtroTurno ? 'border-invictus-400 text-invictus-700 font-medium' : 'border-gray-300'}`}>
              <option value="">Todos</option>
              {Object.entries(NOMBRES_TURNO).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {(busqueda || filtroEstadoPago || filtroTurno) && (
            <div>
              <span className="block text-xs font-semibold text-transparent uppercase tracking-wide mb-1 select-none">.</span>
              <button
                onClick={() => { setBusqueda(''); setFiltroEstadoPago(''); setFiltroTurno(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
        {(busqueda || filtroEstadoPago || filtroTurno) && (
          <p className="text-xs text-gray-400 mt-3">
            Mostrando {alumnosFiltrados.length} de {alumnos.length} alumnos
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : alumnos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">Aún no hay alumnos registrados</p>
            <a href="/admin/register" className="inline-flex items-center gap-2 bg-invictus-600 hover:bg-invictus-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Registrar alumno
            </a>
          </div>
        ) : alumnosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No hay alumnos que coincidan con los filtros</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">CI</th>
                <th className="px-4 py-3 font-semibold">Celular</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Turno</th>
                <th className="px-4 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {alumnosFiltrados.map((a) => (
                <tr key={a.id_usuario} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-[#172033]">{a.nombre}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{a.ci || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{a.celular || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{a.correo}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{getTurnoLabel(a.horario_asignado)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionButton tipo="ver" onClick={() => setViewUserId(a.id_usuario)} />
                      {a.estado_pago !== 'pagado' && (
                        <ActionButton tipo="pagado" onClick={() => handleQuickPay(a)} titulo={`Marcar pago de ${a.nombre}`} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewUserId && (
        <UserDetailModal userId={viewUserId} onClose={() => setViewUserId(null)} />
      )}
    </div>
  );
}

export default Alumnos;
