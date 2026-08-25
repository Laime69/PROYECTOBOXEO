import { useState, useEffect } from 'react';
import { getBitacora } from '../../services/bitacoraService';

const MODULOS = ['', 'auth', 'usuarios', 'pagos', 'asistencias', 'horarios', 'progresos'];
const ACCIONES = ['', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE'];
const ROLES = ['', 'SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno'];

const ROL_LABELS = {
  SuperAdmin: 'Súper Admin',
  Administrador: 'Administrador',
  Recepcionista: 'Recepcionista',
  Entrenador: 'Entrenador',
  Alumno: 'Alumno',
};

const MODULO_LABELS = {
  auth: 'Autenticación',
  usuarios: 'Usuarios',
  pagos: 'Pagos',
  asistencias: 'Asistencias',
  horarios: 'Horarios',
  progresos: 'Progreso',
};

const ACCION_LABELS = {
  LOGIN: 'Inicio de sesión',
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
};

const ACCION_COLORS = {
  LOGIN: 'bg-blue-100 text-blue-800',
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
};

function Bitacora() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const filtros = {};
      if (filtroModulo) filtros.modulo = filtroModulo;
      if (filtroAccion) filtros.accion = filtroAccion;
      if (filtroRol) filtros.rol = filtroRol;
      if (busqueda.trim()) filtros.busqueda = busqueda.trim();
      if (fechaDesde) filtros.fecha_desde = fechaDesde;
      if (fechaHasta) filtros.fecha_hasta = fechaHasta + 'T23:59:59';
      const data = await getBitacora(filtros);
      setRegistros(data.bitacora || []);
    } catch (err) {
      const msg = err?.response?.data?.msg || 'Error al cargar bitácora';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchData(); }, [filtroModulo, filtroAccion, filtroRol, fechaDesde, fechaHasta]);
  useEffect(() => {
    const t = setTimeout(() => { fetchData(); }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#172033]">Bitácora del Sistema</h2>
        <p className="text-slate-500 mt-1">Registro de acciones importantes del sistema</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Buscar</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Usuario, correo o descripción..."
              className="block w-full sm:w-56 mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Rol</label>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="block w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {ROLES.filter(r => r).map(r => (
                <option key={r} value={r}>{ROL_LABELS[r] || r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Módulo</label>
            <select
              value={filtroModulo}
              onChange={(e) => setFiltroModulo(e.target.value)}
              className="block w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {MODULOS.filter(m => m).map(m => (
                <option key={m} value={m}>{MODULO_LABELS[m] || m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Acción</label>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="block w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {ACCIONES.filter(a => a).map(a => (
                <option key={a} value={a}>{ACCION_LABELS[a] || a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="block w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="block w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => {
              setBusqueda('');
              setFiltroRol('');
              setFiltroModulo('');
              setFiltroAccion('');
              setFechaDesde('');
              setFechaHasta('');
            }}
            className="text-sm text-invictus-600 hover:text-invictus-800 font-medium px-3 py-2"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : registros.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No hay registros de actividad</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold">Fecha/Hora</th>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Acción</th>
                  <th className="px-4 py-3 font-semibold">Módulo</th>
                  <th className="px-4 py-3 font-semibold">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{formatFecha(r.fecha_hora)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#172033]">{r.usuario_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{r.rol || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACCION_COLORS[r.accion] || 'bg-gray-100 text-[#172033]'}`}>
                        {ACCION_LABELS[r.accion] || r.accion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{MODULO_LABELS[r.modulo] || r.modulo}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-[300px] truncate">{r.descripcion || '—'}</td>
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

export default Bitacora;
