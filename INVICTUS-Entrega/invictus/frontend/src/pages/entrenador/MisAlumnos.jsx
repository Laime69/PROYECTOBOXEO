import { useState, useEffect } from 'react';
import { getMisAlumnosEntrenador } from '../../services/entrenadorService';

function MisAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroPago, setFiltroPago] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMisAlumnosEntrenador();
        setAlumnos(data.alumnos);
      } catch {
        setError('Error al cargar alumnos');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtrados = alumnos.filter((a) => {
    if (filtroPago && a.estado_pago !== filtroPago) return false;
    const term = busqueda.toLowerCase();
    return (
      (a.alumno_nombre || '').toLowerCase().includes(term) ||
      (a.alumno_correo || '').toLowerCase().includes(term)
    );
  });

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
    const style = styles[estado] || 'bg-gray-100 text-[#172033]';
    const label = estado === 'pagado' ? 'Habilitado' : estado === 'vencido' ? 'Vencido' : 'Pendiente';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>{label}</span>;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#172033]">Mis Alumnos</h2>
        <p className="text-slate-500 mt-1">Consulta de alumnos (solo lectura)</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full max-w-xs"
        />
        <div className="flex gap-1">
          {['', 'pagado', 'pendiente', 'vencido'].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroPago(est)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                filtroPago === est
                  ? 'bg-invictus-600 text-white'
                  : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
              }`}
            >
              {est === '' ? 'Todos' : est === 'pagado' ? 'Habilitados' : est === 'pendiente' ? 'Pendientes' : 'Vencidos'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {busqueda ? 'No se encontraron alumnos' : 'No hay alumnos registrados'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Horario</th>
                <th className="px-4 py-3 font-semibold">Turno</th>
                <th className="px-4 py-3 font-semibold">Habilitación</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => (
                <tr key={a.id || a.alumno_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-[#172033]">{a.alumno_nombre}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{a.alumno_correo}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{a.clase} ({a.hora_inicio?.slice(0,5)}–{a.hora_fin?.slice(0,5)})</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{a.nombre_turno || '—'}</td>
                  <td className="px-4 py-3">{getPagoBadge(a.estado_pago)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default MisAlumnos;
