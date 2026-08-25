import { useState, useEffect } from 'react';
import { getGrilla } from '../../services/horarioService';
import { getAlumnosByTurno } from '../../services/alumnoHorarioService';

const DIAS = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
];

const TURNOS = [
  { key: 'manana', label: 'Mañana', hora: '09:00 - 11:00' },
  { key: 'tarde', label: 'Tarde', hora: '14:00 - 16:00' },
  { key: 'noche', label: 'Noche', hora: '19:00 - 21:00' },
];

const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

function RecepcionHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAlumnosModal, setShowAlumnosModal] = useState(false);
  const [alumnosList, setAlumnosList] = useState([]);
  const [selectedTurnoAlumnos, setSelectedTurnoAlumnos] = useState('');
  const [alumnosLoading, setAlumnosLoading] = useState(false);

  const grillaMap = {};
  horarios.forEach(h => {
    const key = `${h.turno}_${h.dia_semana}`;
    grillaMap[key] = h;
  });

  const fetchGrilla = async () => {
    setLoading(true);
    try {
      const data = await getGrilla();
      setHorarios(data.horarios);
    } catch {
      setError('Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGrilla(); }, []);

  const openVerAlumnos = async (turno) => {
    setSelectedTurnoAlumnos(turno);
    setShowAlumnosModal(true);
    setAlumnosLoading(true);
    try {
      const data = await getAlumnosByTurno(turno);
      setAlumnosList(data.alumnos || []);
    } catch {
      setAlumnosList([]);
    } finally {
      setAlumnosLoading(false);
    }
  };

  const getCelda = (turno, dia) => {
    const key = `${turno}_${dia}`;
    return grillaMap[key] || null;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#172033]">Horarios Semanales</h2>
        <p className="text-slate-500 mt-1">Consulta de horarios de clases</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-500 w-44">Turno</th>
                  {DIAS.map(d => (
                    <th key={d.key} className="px-4 py-3 text-center text-sm font-semibold text-slate-500">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TURNOS.map(turno => (
                  <tr key={turno.key} className="border-b border-gray-100">
                    <td className="px-4 py-4 text-sm font-medium text-[#172033] bg-gray-50/50">
                      <div>{turno.label}</div>
                      <div className="text-xs text-gray-400 font-normal">{turno.hora}</div>
                    </td>
                    {DIAS.map(dia => {
                      const h = getCelda(turno.key, dia.key);
                      const isSparring = dia.key === 'viernes' || h?.tipo_actividad === 'sparring';
                      const cellBg = isSparring ? 'bg-[#FFF1F2] border-[#E11D48]/30' : 'bg-[#F0FDF8] border-[#00A878]/25';
                      return (
                        <td key={dia.key} className={`px-2 py-2 text-center border-l border-gray-50 ${cellBg}`}>
                          {h ? (
                            <div className="flex flex-col items-center gap-1 min-h-[100px] justify-center">
                              {isSparring && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                  Sparring
                                </span>
                              )}
                              <span className={`text-sm font-medium ${h.entrenador_nombre ? 'text-[#172033]' : 'text-gray-400'}`}>
                                {h.entrenador_nombre || 'Sin asignar'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-slate-500'}`}>
                                {h.estado === 'activo' ? 'Activo' : 'Inactivo'}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                Alumnos: {h.total_alumnos ?? 0}
                              </span>
                              <button
                                onClick={() => openVerAlumnos(turno.key)}
                                className="px-2 py-0.5 text-xs font-medium text-invictus-700 bg-invictus-50 hover:bg-invictus-100 rounded transition-colors mt-1"
                              >
                                Ver Alumnos
                              </button>
                            </div>
                          ) : (
                            <div className="text-gray-300 text-sm min-h-[100px] flex items-center justify-center">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          <span className="text-slate-500">Activo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" />
          <span className="text-slate-500">Inactivo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Sparring</span>
        </div>
      </div>

      {showAlumnosModal && (
        <div className="fixed inset-0 bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-lg mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#172033]">
                Alumnos - Turno {NOMBRES_TURNO[selectedTurnoAlumnos] || selectedTurnoAlumnos}
              </h3>
              <button onClick={() => setShowAlumnosModal(false)} className="text-gray-400 hover:text-slate-500 text-xl">&times;</button>
            </div>
            {alumnosLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
              </div>
            ) : alumnosList.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No hay alumnos inscritos en este turno</div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-gray-100">
                      <th className="px-3 py-2 font-medium">Nombre</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Estado pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosList.map((al) => (
                      <tr key={al.id_usuario || al.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-[#172033]">{al.alumno_nombre || al.nombre}</td>
                        <td className="px-3 py-2 text-slate-500">{al.alumno_correo || al.correo || '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            al.estado_pago === 'pagado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {al.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowAlumnosModal(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-[#172033] border border-gray-300 rounded-lg">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecepcionHorarios;
