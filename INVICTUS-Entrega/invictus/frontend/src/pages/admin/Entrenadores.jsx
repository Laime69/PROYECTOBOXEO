import { useState, useEffect } from 'react';
import { getUsers } from '../../services/usuarioService';
import UserDetailModal from '../../components/UserDetailModal';

function Entrenadores() {
  const [entrenadores, setEntrenadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewUserId, setViewUserId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getUsers('Entrenador');
        setEntrenadores(data.usuarios);
      } catch {
        setError('Error al cargar entrenadores');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Entrenadores</h2>
        <p className="text-gray-500 mt-1">Listado de entrenadores de la academia</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : entrenadores.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay entrenadores registrados</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">CI</th>
                <th className="px-4 py-3 font-medium">Celular</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Especialidad</th>
                <th className="px-4 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {entrenadores.map((e) => (
                <tr key={e.id_usuario} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{e.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.ci || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.celular || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.correo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.especialidad || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setViewUserId(e.id_usuario)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver
                    </button>
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

export default Entrenadores;
