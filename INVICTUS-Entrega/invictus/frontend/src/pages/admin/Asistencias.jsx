import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAsistencias, createAsistencia, updateAsistencia, deleteAsistencia } from '../../services/asistenciaService';
import { getUsers } from '../../services/usuarioService';
import { getAlumnosByTurno } from '../../services/alumnoHorarioService';

const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };
const ESTADOS = ['presente', 'falta', 'tardanza', 'justificado'];
const ESTADO_LABELS = { presente: 'P', falta: 'F', tardanza: 'T', justificado: 'J' };
const ESTADO_COLORS = {
  presente: 'bg-green-500 text-white hover:bg-green-600',
  falta: 'bg-red-500 text-white hover:bg-red-600',
  tardanza: 'bg-yellow-500 text-white hover:bg-yellow-600',
  justificado: 'bg-blue-500 text-white hover:bg-blue-600',
};
const ESTADO_BG = {
  presente: 'border-l-green-400',
  falta: 'border-l-red-400',
  tardanza: 'border-l-yellow-400',
  justificado: 'border-l-blue-400',
};

function Asistencias() {
  const [searchParams] = useSearchParams();
  const turnoParam = searchParams.get('turno');
  const fechaParam = searchParams.get('fecha');

  const [asistencias, setAsistencias] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtroFecha, setFiltroFecha] = useState(fechaParam || new Date().toISOString().slice(0, 10));
  const [turnoActivo, setTurnoActivo] = useState(turnoParam || '');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ alumno_id: '', fecha: '', estado: 'presente', observacion: '' });

  const fetchAsistencias = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAsistencias(filtroFecha ? { fecha: filtroFecha } : {});
      let lista = data.asistencias;
      if (turnoActivo) {
        const alumnosTurno = await getAlumnosByTurno(turnoActivo);
        const idsAlumnosTurno = new Set((alumnosTurno.alumnos || []).map(a => a.id_usuario));
        lista = lista.filter(a => idsAlumnosTurno.has(a.alumno_id));
      }
      setAsistencias(lista);
    } catch (err) {
      setError(err?.response?.data?.msg || 'Error al cargar asistencias');
    } finally {
      setLoading(false);
    }
  }, [filtroFecha, turnoActivo]);

  const fetchAlumnos = useCallback(async () => {
    try {
      if (turnoActivo) {
        const data = await getAlumnosByTurno(turnoActivo);
        setAlumnos(data.alumnos || []);
      } else {
        const data = await getUsers('Alumno');
        setAlumnos(data.usuarios);
      }
    } catch {}
  }, [turnoActivo]);

  useEffect(() => { fetchAlumnos(); fetchAsistencias(); }, []);
  useEffect(() => { fetchAsistencias(); }, [fetchAsistencias]);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 6000); return () => clearTimeout(t); }
  }, [error]);

  const getAsistenciaForAlumno = (alumnoId) => {
    return asistencias.find(a => a.alumno_id === alumnoId || a.alumno_id === parseInt(alumnoId));
  };

  const toggleEstado = async (alumnoId) => {
    const existente = getAsistenciaForAlumno(alumnoId);
    const cicloEstados = ['presente', 'falta', 'tardanza', 'justificado'];
    const currentIdx = cicloEstados.indexOf(existente?.estado);
    const nextEstado = cicloEstados[(currentIdx + 1) % cicloEstados.length];

    try {
      if (existente) {
        await updateAsistencia(existente.id_asistencia, { ...existente, estado: nextEstado, fecha: filtroFecha });
      } else {
        await createAsistencia({ alumno_id: alumnoId, fecha: filtroFecha, estado: nextEstado });
      }
      setSuccess('Estado actualizado');
      fetchAsistencias();
    } catch (err) {
      setError(err?.response?.data?.msg || 'Error al actualizar');
    }
  };

  const openEdit = (a) => {
    setEditando(a);
    setForm({ alumno_id: a.alumno_id, fecha: a.fecha?.slice(0, 10), estado: a.estado, observacion: a.observacion || '' });
    setModal(true);
  };

  const openCreate = () => {
    setEditando(null);
    setForm({ alumno_id: '', fecha: filtroFecha, estado: 'presente', observacion: '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await updateAsistencia(editando.id_asistencia, form);
        setSuccess('Asistencia actualizada');
      } else {
        await createAsistencia(form);
        setSuccess('Asistencia registrada');
      }
      setModal(false);
      fetchAsistencias();
    } catch (err) {
      setError(err?.response?.data?.msg || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta asistencia?')) return;
    try {
      await deleteAsistencia(id);
      setSuccess('Asistencia eliminada');
      fetchAsistencias();
    } catch {
      setError('Error al eliminar');
    }
  };

  const stats = {
    total: alumnos.length,
    presente: asistencias.filter(a => a.estado === 'presente').length,
    falta: asistencias.filter(a => a.estado === 'falta').length,
    tardanza: asistencias.filter(a => a.estado === 'tardanza').length,
    justificado: asistencias.filter(a => a.estado === 'justificado').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#172033]">Control de Asistencias</h2>
          <p className="text-slate-500 mt-1">Planilla diaria — haz clic en el estado para rotar</p>
        </div>
        <button onClick={openCreate} className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700">
          + Registrar
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">{success}</div>}

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Fecha:</label>
          <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Turno:</label>
          <select value={turnoActivo} onChange={(e) => setTurnoActivo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="">Todos</option>
            <option value="manana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-700' },
          { label: 'Presentes', value: stats.presente, color: 'bg-green-100 text-green-700' },
          { label: 'Faltas', value: stats.falta, color: 'bg-red-100 text-red-700' },
          { label: 'Tardanzas', value: stats.tardanza, color: 'bg-yellow-100 text-yellow-700' },
          { label: 'Justificados', value: stats.justificado, color: 'bg-blue-100 text-blue-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg px-3 py-2 text-center ${s.color}`}>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : alumnos.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No hay alumnos{turnoActivo ? ` en el turno ${NOMBRES_TURNO[turnoActivo]}` : ''}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 w-8">#</th>
                  <th className="px-4 py-3">Alumno</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3">Observación</th>
                  <th className="px-4 py-3 text-right w-32">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map((al, idx) => {
                  const alId = al.id_usuario || al.id;
                  const alNombre = al.alumno_nombre || al.nombre;
                  const existente = getAsistenciaForAlumno(alId);
                  const estado = existente?.estado || null;
                  return (
                    <tr key={alId} className={`border-b border-gray-50 hover:bg-gray-50/50 ${estado ? `border-l-4 ${ESTADO_BG[estado]}` : 'border-l-4 border-l-gray-200'}`}>
                      <td className="px-4 py-2.5 text-xs text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-[#172033]">{alNombre}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => toggleEstado(alId)}
                          title={`Clic para rotar${estado ? ` (${estado})` : ''}`}
                          className={`inline-flex items-center justify-center w-10 h-7 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                            estado ? ESTADO_COLORS[estado] : 'bg-gray-200 text-slate-500 hover:bg-gray-300'
                          }`}
                        >
                          {estado ? ESTADO_LABELS[estado] : '—'}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate text-xs">
                        {existente?.observacion || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {existente && (
                            <>
                              <button onClick={() => openEdit(existente)} className="text-invictus-600 hover:text-invictus-800 text-xs font-medium">Editar</button>
                              <button onClick={() => handleDelete(existente.id_asistencia)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"></span> Presente</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"></span> Falta</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block"></span> Tardanza</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block"></span> Justificado</span>
        <span className="ml-2 text-gray-300">Haz clic en el estado para rotar</span>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-bold text-[#172033] mb-4">{editando ? 'Editar Asistencia' : 'Registrar Asistencia'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Alumno</label>
                <select value={form.alumno_id} onChange={(e) => setForm({ ...form, alumno_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                  <option value="">Seleccionar alumno</option>
                  {alumnos.map((al) => (
                    <option key={al.id_usuario || al.id} value={al.id_usuario || al.id}>{al.alumno_nombre || al.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Fecha</label>
                <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Estado</label>
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="presente">Presente</option>
                  <option value="falta">Falta</option>
                  <option value="tardanza">Tardanza</option>
                  <option value="justificado">Justificado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Observación</label>
                <textarea value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows="2" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-[#172033]">Cancelar</button>
                <button type="submit" className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700">
                  {editando ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Asistencias;
