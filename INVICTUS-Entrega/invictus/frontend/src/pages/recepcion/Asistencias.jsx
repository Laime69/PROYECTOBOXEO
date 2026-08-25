import { useState, useEffect } from 'react';
import { getAsistencias } from '../../services/asistenciaService';

function RecepcionAsistencias() {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().slice(0, 10));
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroActividad, setFiltroActividad] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const getDiaSemana = (fecha) => {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const date = new Date(fecha + 'T12:00:00');
    return dias[date.getDay()];
  };

  const fetchAsistencias = async () => {
    setLoading(true);
    try {
      const params = {};
      if (fechaDesde && fechaHasta) {
        params.fecha_inicio = fechaDesde;
        params.fecha_fin = fechaHasta;
      } else if (filtroFecha) {
        params.fecha = filtroFecha;
      }
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroActividad) params.tipo_actividad = filtroActividad;
      if (busqueda.trim()) params.busqueda = busqueda.trim();
      const data = await getAsistencias(params);
      setAsistencias(data.asistencias || []);
    } catch (err) {
      const msg = err?.response?.data?.msg || 'Error al cargar asistencias';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAsistencias(); }, []);
  useEffect(() => { fetchAsistencias(); }, [filtroFecha, filtroEstado, filtroActividad]);
  useEffect(() => {
    const t = setTimeout(() => { fetchAsistencias(); }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const limpiarFiltros = () => {
    setFiltroFecha(new Date().toISOString().slice(0, 10));
    setFechaDesde('');
    setFechaHasta('');
    setFiltroEstado('');
    setFiltroActividad('');
    setBusqueda('');
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      presente: 'bg-green-100 text-green-800',
      falta: 'bg-red-100 text-red-800',
      permiso: 'bg-yellow-100 text-yellow-800',
      tardanza: 'bg-orange-100 text-orange-800',
      justificado: 'bg-blue-100 text-blue-800',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-[#172033]'}`;
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      presente: 'Presente', falta: 'Falta', permiso: 'Permiso',
      tardanza: 'Tardanza', justificado: 'Justificado',
    };
    return labels[estado] || estado;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#172033]">Asistencias</h2>
        <p className="text-slate-500 mt-1">Consulta de asistencias de alumnos</p>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Buscar</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Alumno, correo o entrenador..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-invictus-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Fecha</label>
            <input
              type="date"
              value={filtroFecha}
              disabled={!!(fechaDesde && fechaHasta)}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className={`border border-gray-300 rounded-lg px-3 py-2 text-sm ${fechaDesde && fechaHasta ? 'opacity-40' : ''}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Rango (desde)</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Rango (hasta)</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="presente">Presente</option>
              <option value="falta">Falta</option>
              <option value="tardanza">Tardanza</option>
              <option value="justificado">Justificado</option>
              <option value="permiso">Permiso</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Actividad</label>
            <select
              value={filtroActividad}
              onChange={(e) => setFiltroActividad(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              <option value="entrenamiento">Entrenamiento</option>
              <option value="sparring">Sparring</option>
            </select>
          </div>
          <button
            onClick={limpiarFiltros}
            className="text-sm text-invictus-600 hover:text-invictus-800 font-medium px-3 py-2"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : asistencias.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No hay asistencias que coincidan con los filtros</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold">Alumno</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Actividad</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Entrenador</th>
                <th className="px-4 py-3 font-semibold">Observación</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((a) => {
                const diaSem = getDiaSemana(a.fecha);
                const isSparring = a.tipo_actividad === 'sparring' || diaSem === 'viernes';
                return (
                  <tr key={a.id_asistencia} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-[#172033]">{a.alumno_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(a.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {isSparring ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Sparring</span>
                      ) : (
                        <span className="text-sm text-slate-500">Entrenamiento</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getEstadoBadge(a.estado)}>
                        {getEstadoLabel(a.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{a.entrenador_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">{a.observacion || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default RecepcionAsistencias;
