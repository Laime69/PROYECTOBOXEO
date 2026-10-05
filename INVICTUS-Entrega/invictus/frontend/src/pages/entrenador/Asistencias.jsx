import { useState, useEffect, useCallback } from 'react';
import { getMisAlumnosEntrenador, getMisHorariosEntrenador } from '../../services/entrenadorService';
import PlanillaAsistencia from '../../components/PlanillaAsistencia';

function Asistencias() {
  const [alumnos, setAlumnos] = useState([]);
  const [turnosUnicos, setTurnosUnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [alumnosData, horariosData] = await Promise.all([
        getMisAlumnosEntrenador(),
        getMisHorariosEntrenador(),
      ]);
      setAlumnos(alumnosData.alumnos || []);
      const turnos = [...new Set((horariosData.horarios || []).filter(h => h.turno).map(h => h.turno))];
      setTurnosUnicos(turnos);
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
          turnosUnicos={turnosUnicos}
          editable
          titulo="Asistencia de Entrenamiento"
          subtitulo="Planilla de control de asistencias"
        />
      )}
    </div>
  );
}

export default Asistencias;