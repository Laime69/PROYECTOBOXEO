import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGrilla, updateHorario } from '../../services/horarioService';
import { getUsers } from '../../services/usuarioService';
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
const NOMBRES_DIA = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes',
};

function Horarios() {
  const navigate = useNavigate();
  const [horarios, setHorarios] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(false);
  const [celdaEdit, setCeldaEdit] = useState(null);
  const [form, setForm] = useState({
    entrenador_id: '', estado: 'activo', tipo_actividad: 'entrenamiento',
  });
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

  const fetchEntrenadores = async () => {
    try {
      const data = await getUsers('Entrenador');
      setEntrenadores(data.usuarios);
    } catch {}
  };

  useEffect(() => {
    fetchEntrenadores();
    fetchGrilla();
  }, []);

  const openEdit = (turno, dia) => {
    const key = `${turno}_${dia}`;
    const h = grillaMap[key];
    if (!h) return;
    setCeldaEdit(h);
    setForm({
      entrenador_id: h.entrenador_id || '',
      estado: h.estado || 'activo',
      tipo_actividad: h.tipo_actividad || 'entrenamiento',
      dia_label: NOMBRES_DIA[h.dia_semana] || h.dia,
      turno_label: NOMBRES_TURNO[h.turno] || h.nombre_turno || h.turno,
      hora_inicio: h.hora_inicio?.slice(0, 5),
      hora_fin: h.hora_fin?.slice(0, 5),
      dia_semana: h.dia_semana,
      turno: h.turno,
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!celdaEdit) return;
    try {
      const payload = {
        entrenador_id: form.entrenador_id || null,
        estado: form.estado,
      };
      await updateHorario(celdaEdit.id_horario, payload);
      setSuccess(`Bloque actualizado: ${form.turno_label} - ${form.dia_label}`);
      setModal(false);
      fetchGrilla();
    } catch {
      setError('Error al guardar');
    }
  };

  const openVerAlumnos = async (turno, e) => {
    e.stopPropagation();
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

  const irAAsistencia = (turno, dia, e) => {
    e.stopPropagation();
    const hoy = new Date().toISOString().slice(0, 10);
    navigate(`/admin/asistencias?turno=${turno}&fecha=${hoy}`);
  };

  const getCelda = (turno, dia) => {
    const key = `${turno}_${dia}`;
    return grillaMap[key] || null;
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      activo: 'bg-green-100 text-green-800',
      inactivo: 'bg-gray-100 text-slate-500',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-[#172033]'}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#172033]">Horarios Semanales</h2>
          <p className="text-slate-500 mt-1">Asigna entrenadores a cada bloque horario</p>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">{success}</div>}

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
                    <th key={d.key} className="px-4 py-3 text-center text-sm font-semibold text-slate-500">
                      {d.label}
                    </th>
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
                        <td
                          key={dia.key}
                          className={`px-2 py-2 text-center cursor-pointer hover:bg-invictus-50 transition-colors border-l border-gray-50 ${cellBg}`}
                          onClick={() => openEdit(turno.key, dia.key)}
                        >
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
                              <span className={getEstadoBadge(h.estado)}>
                                {h.estado === 'activo' ? 'Activo' : 'Inactivo'}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                Alumnos: {h.total_alumnos ?? 0}
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                <button
                                  onClick={(e) => openVerAlumnos(turno.key, e)}
                                  className="px-2 py-0.5 text-xs font-medium text-invictus-700 bg-invictus-50 hover:bg-invictus-100 rounded transition-colors"
                                >
                                  Ver
                                </button>
                                <button
                                  onClick={(e) => irAAsistencia(turno.key, dia.key, e)}
                                  className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                >
                                  Asistencia
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-300 text-sm min-h-[100px] flex items-center justify-center">
                              —
                            </div>
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

      {modal && celdaEdit && (
        <div className="fixed inset-0 bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-bold text-[#172033] mb-4">
              Editar Bloque: {form.turno_label} - {form.dia_label}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-xs text-slate-500">Día</p>
                  <p className="text-sm font-medium text-[#172033]">{form.dia_label}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Turno</p>
                  <p className="text-sm font-medium text-[#172033]">{form.turno_label}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Hora inicio</p>
                  <p className="text-sm font-medium text-[#172033]">{form.hora_inicio}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Hora fin</p>
                  <p className="text-sm font-medium text-[#172033]">{form.hora_fin}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Tipo de actividad</p>
                {form.dia_semana === 'viernes' || form.tipo_actividad === 'sparring' ? (
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                    Sparring
                  </span>
                ) : (
                  <span className="text-sm text-[#172033] font-medium">Entrenamiento</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Entrenador asignado</label>
                <select
                  value={form.entrenador_id}
                  onChange={(e) => setForm({ ...form, entrenador_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Sin asignar</option>
                  {entrenadores.map((en) => (
                    <option key={en.id_usuario} value={en.id_usuario}>{en.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-[#172033]">Cancelar</button>
                <button type="submit"
                  className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default Horarios;
