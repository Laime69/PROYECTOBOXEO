import { useState, useEffect } from 'react';
import { getUsers, updateUser } from '../../services/usuarioService';
import { getHorarioActual } from '../../services/alumnoHorarioService';
import UserDetailModal from '../../components/UserDetailModal';

const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

const ESTADOS_PAGO = ['', 'pagado', 'pendiente', 'vencido'];
const ESTADO_PAGO_LABELS = { pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido' };

function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewUserId, setViewUserId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');

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
    return `px-2 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-gray-800'}`;
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Alumnos</h2>
        <p className="text-gray-500 mt-1">Gestiona los alumnos registrados en el sistema</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, correo, CI o celular..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Estado de pago</label>
            <div className="flex gap-1">
              {ESTADOS_PAGO.map((est) => (
                <button
                  key={est}
                  onClick={() => setFiltroEstadoPago(est)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filtroEstadoPago === est
                      ? 'bg-invictus-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {est ? ESTADO_PAGO_LABELS[est] : 'Todos'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Turno</label>
            <div className="flex gap-1">
              {['', ...Object.keys(NOMBRES_TURNO)].map((tur) => (
                <button
                  key={tur}
                  onClick={() => setFiltroTurno(tur)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filtroTurno === tur
                      ? 'bg-invictus-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tur ? NOMBRES_TURNO[tur] : 'Todos'}
                </button>
              ))}
            </div>
          </div>
        </div>
        {(busqueda || filtroEstadoPago || filtroTurno) && (
          <p className="text-xs text-gray-400 mt-2">
            {alumnosFiltrados.length} de {alumnos.length} alumnos
            {(busqueda || filtroEstadoPago || filtroTurno) && (
              <button
                onClick={() => { setBusqueda(''); setFiltroEstadoPago(''); setFiltroTurno(''); }}
                className="ml-2 text-invictus-600 hover:text-invictus-800 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : alumnos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay alumnos registrados</div>
        ) : alumnosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay alumnos que coincidan con los filtros</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">CI</th>
                <th className="px-4 py-3 font-medium">Celular</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Turno</th>
                <th className="px-4 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {alumnosFiltrados.map((a) => (
                <tr key={a.id_usuario} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{a.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.ci || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.celular || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.correo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getTurnoLabel(a.horario_asignado)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewUserId(a.id_usuario)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver
                      </button>
                      {a.estado_pago !== 'pagado' && (
                        <button
                          onClick={() => handleQuickPay(a)}
                          className="text-sm text-green-600 hover:text-green-800 font-medium"
                        >
                          Pagado
                        </button>
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
