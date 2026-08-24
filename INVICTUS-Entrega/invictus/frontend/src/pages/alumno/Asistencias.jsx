import { useState, useEffect } from 'react';
import { getMisAsistencias } from '../../services/alumnoService';

function Asistencias() {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().slice(0, 10));

  const fetchAsistencias = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroFecha) params.fecha = filtroFecha;
      const data = await getMisAsistencias(params);
      setAsistencias(data.asistencias || []);
    } catch {
      setError('Error al cargar asistencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAsistencias(); }, []);
  useEffect(() => { fetchAsistencias(); }, [filtroFecha]);

  const getEstadoBadge = (estado) => {
    const styles = {
      presente: 'bg-green-100 text-green-800',
      falta: 'bg-red-100 text-red-800',
      permiso: 'bg-yellow-100 text-yellow-800',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-gray-800'}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mis Asistencias</h2>
        <p className="text-gray-500 mt-1">Consulta de tus asistencias registradas</p>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-500 mr-2">Filtrar por fecha:</label>
        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : asistencias.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay asistencias registradas para esta fecha</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Entrenador</th>
                <th className="px-4 py-3 font-medium">Observación</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((a) => (
                <tr key={a.id_asistencia} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(a.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={getEstadoBadge(a.estado)}>
                      {a.estado === 'presente' ? 'Presente' : a.estado === 'falta' ? 'Falta' : 'Permiso'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.entrenador_nombre || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{a.observacion || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Asistencias;
