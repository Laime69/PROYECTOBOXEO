import { useState, useEffect } from 'react';
import { getMisHorarios } from '../../services/alumnoService';

const DIAS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const NOMBRES_DIA = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes' };
const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

function Horarios() {
  const [asignado, setAsignado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHorarios = async () => {
    setLoading(true);
    try {
      const data = await getMisHorarios();
      setAsignado(data.horarios?.asignado || null);
    } catch {
      setError('Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHorarios(); }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#172033]">Mi Horario Semanal</h2>
        <p className="text-slate-500 mt-1">Turno asignado en la academia</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
        </div>
      ) : !asignado ? (
        <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-12 text-center">
          <p className="text-slate-500 text-lg">No tienes un horario asignado</p>
          <p className="text-gray-400 text-sm mt-2">Contacta con la administración para asignarte un turno</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-500">Turno</p>
                <p className="text-lg font-semibold text-[#172033]">
                  {NOMBRES_TURNO[asignado.turno] || asignado.nombre_turno || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Horario</p>
                <p className="text-lg font-semibold text-[#172033]">
                  {asignado.horarios_semana?.[0]?.hora_inicio?.slice(0,5) || asignado.hora_inicio?.slice(0,5)} – {asignado.horarios_semana?.[0]?.hora_fin?.slice(0,5) || asignado.hora_fin?.slice(0,5)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Días</p>
                <p className="text-lg font-semibold text-[#172033]">Lunes a Viernes</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Estado</p>
                <p className="text-lg font-semibold text-green-600">Activo</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#172033]">Detalle por día</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {DIAS_ORDER.map(diaKey => {
                const horarioDia = asignado.horarios_semana?.find(h => h.dia_semana === diaKey);
                const isSparring = diaKey === 'viernes' || horarioDia?.tipo_actividad === 'sparring';
                return (
                  <div key={diaKey} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-[#172033] w-24">{NOMBRES_DIA[diaKey]}</span>
                      {isSparring ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Sparring</span>
                      ) : (
                        <span className="text-sm text-slate-500">Entrenamiento</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {horarioDia?.entrenador_nombre ? (
                        <span>Entrenador: {horarioDia.entrenador_nombre}</span>
                      ) : (
                        <span className="text-gray-400">Sin entrenador asignado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Horarios;
