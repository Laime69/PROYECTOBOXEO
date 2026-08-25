import { useState, useEffect } from 'react';
import { getMisProgresos } from '../../services/progresoService';

const NOMBRES_NIVEL = { inicial: 'Inicial', basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado', competitivo: 'Competitivo' };
const COLORES_NIVEL = { inicial: 'bg-red-100 text-red-800', basico: 'bg-amber-100 text-amber-800', intermedio: 'bg-blue-100 text-blue-800', avanzado: 'bg-green-100 text-green-800', competitivo: 'bg-purple-100 text-purple-800' };

const CAMPOS = [
  { key: 'tecnica', label: 'Técnica' },
  { key: 'defensa', label: 'Defensa' },
  { key: 'resistencia', label: 'Resistencia' },
  { key: 'velocidad', label: 'Velocidad' },
  { key: 'fuerza', label: 'Fuerza' },
  { key: 'disciplina', label: 'Disciplina' },
  { key: 'sparring', label: 'Sparring' },
];

function AlumnoProgreso() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await getMisProgresos();
        setData(result);
      } catch {
        setError('Error al cargar tu progreso');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getNivelBadge = (nivel) => {
    const color = COLORES_NIVEL[nivel] || 'bg-gray-100 text-[#172033]';
    const label = NOMBRES_NIVEL[nivel] || nivel;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
      </div>
    );
  }

  const ultima = data?.ultima_evaluacion;
  const historial = data?.historial || [];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#172033]">Mi Progreso Deportivo</h2>
        <p className="text-slate-500 mt-1">Evaluaciones de tu rendimiento</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
          <p className="text-sm text-slate-500 font-medium">Nivel Actual</p>
          <div className="mt-2 text-lg font-bold">
            {ultima ? getNivelBadge(ultima.nivel) : <span className="text-gray-400">Sin evaluaciones</span>}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
          <p className="text-sm text-slate-500 font-medium">Último Promedio</p>
          <p className="text-2xl font-bold text-[#172033] mt-1">{ultima?.promedio ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
          <p className="text-sm text-slate-500 font-medium">Total Evaluaciones</p>
          <p className="text-2xl font-bold text-[#172033] mt-1">{data?.total_evaluaciones ?? 0}</p>
        </div>
      </div>

      {ultima && ultima.observacion && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 mb-6">
          <span className="font-semibold">Observación del entrenador: </span>
          {ultima.observacion}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-[#172033]">Historial de Evaluaciones</h3>
        </div>
        {historial.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Aún no tienes evaluaciones registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-center">Nivel</th>
                  {CAMPOS.map((c) => (
                    <th key={c.key} className="px-3 py-3 font-medium text-center text-xs">{c.label}</th>
                  ))}
                  <th className="px-3 py-3 font-medium text-center">Prom.</th>
                  <th className="px-4 py-3 font-semibold">Observación</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(h.fecha_evaluacion)}</td>
                    <td className="px-4 py-3 text-center">{getNivelBadge(h.nivel)}</td>
                    {CAMPOS.map((c) => (
                      <td key={c.key} className="px-3 py-3 text-sm text-center text-slate-500">{h[c.key] ?? '—'}</td>
                    ))}
                    <td className="px-3 py-3 text-sm text-center font-semibold text-gray-700">{h.promedio ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-[150px] truncate" title={h.observacion}>{h.observacion || '—'}</td>
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

export default AlumnoProgreso;
