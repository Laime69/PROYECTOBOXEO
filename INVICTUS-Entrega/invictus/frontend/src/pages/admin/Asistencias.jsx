import { useState, useEffect, useCallback } from 'react';
import { getUsers } from '../../services/usuarioService';
import { getAlumnosByTurno } from '../../services/alumnoHorarioService';
import PlanillaAsistencia from '../../components/PlanillaAsistencia';

const TURNOS = ['manana', 'tarde', 'noche'];

function Asistencias() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers('Alumno');
      const lista = data.usuarios || [];
      const turnosData = await Promise.all(TURNOS.map(t => getAlumnosByTurno(t)));
      const mapaTurno = {};
      turnosData.forEach((td, i) => {
        (td.alumnos || []).forEach(a => {
          mapaTurno[a.id_usuario] = TURNOS[i];
        });
      });
      setAlumnos(lista.map(u => ({ ...u, turno_asignado: mapaTurno[u.id_usuario] })));
    } catch (err) {
      setError(err?.response?.data?.msg || 'Error al cargar alumnos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
        </div>
      ) : (
        <PlanillaAsistencia
          alumnos={alumnos}
          turnosUnicos={TURNOS}
          editable
          titulo="Control de Asistencias"
          subtitulo="Planilla semanal y mensual de asistencias de todos los alumnos"
        />
      )}
    </div>
  );
}

export default Asistencias;