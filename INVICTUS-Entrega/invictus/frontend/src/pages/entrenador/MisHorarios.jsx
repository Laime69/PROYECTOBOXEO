import { useState, useEffect } from 'react';
import { getMisHorariosEntrenador } from '../../services/entrenadorService';

const DIAS_ORDER = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5 };
const TURNOS_ORDER = { manana: 1, tarde: 2, noche: 3 };

function MisHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHorarios = async () => {
    setLoading(true);
    try {
      const data = await getMisHorariosEntrenador();
      setHorarios(data.horarios);
    } catch {
      setError('Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHorarios(); }, []);

  const getEstadoBadge = (estado) => {
    const styles = {
      activo: 'bg-green-100 text-green-800',
      inactivo: 'bg-gray-100 text-[#172033]',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-[#172033]'}`;
  };

  const sortedHorarios = [...horarios].sort((a, b) => {
    const turnoA = TURNOS_ORDER[a.turno] || 99;
    const turnoB = TURNOS_ORDER[b.turno] || 99;
    if (turnoA !== turnoB) return turnoA - turnoB;
    const diaA = DIAS_ORDER[a.dia_semana] || 99;
    const diaB = DIAS_ORDER[b.dia_semana] || 99;
    return diaA - diaB;
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#172033]">Mis Horarios</h2>
        <p className="text-slate-500 mt-1">Clases asignadas como entrenador</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : sortedHorarios.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No tienes horarios asignados</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold">Turno</th>
                <th className="px-4 py-3 font-semibold">Día</th>
                <th className="px-4 py-3 font-semibold">Horario</th>
                <th className="px-4 py-3 font-semibold">Actividad</th>
                <th className="px-4 py-3 font-semibold">Alumnos</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sortedHorarios.map((h) => {
                const isSparring = h.tipo_actividad === 'sparring' || h.dia_semana === 'viernes';
                return (
                  <tr key={h.id_horario} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-[#172033]">{h.nombre_turno || h.turno || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{h.dia}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {h.hora_inicio?.slice(0, 5)} – {h.hora_fin?.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3">
                      {isSparring ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Sparring</span>
                      ) : (
                        <span className="text-sm text-slate-500">Entrenamiento</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{h.total_alumnos ?? 0} alumnos</td>
                    <td className="px-4 py-3">
                      <span className={getEstadoBadge(h.estado)}>
                        {h.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
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

export default MisHorarios;
