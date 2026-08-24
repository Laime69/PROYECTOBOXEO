import { useState, useEffect } from 'react';
import { getMisAlumnosEntrenador } from '../../services/entrenadorService';
import { getHistorialProgreso, createProgreso } from '../../services/progresoService';

const CAMPOS = [
  { key: 'tecnica', label: 'Técnica' },
  { key: 'defensa', label: 'Defensa' },
  { key: 'resistencia', label: 'Resistencia' },
  { key: 'velocidad', label: 'Velocidad' },
  { key: 'fuerza', label: 'Fuerza' },
  { key: 'disciplina', label: 'Disciplina' },
  { key: 'sparring', label: 'Sparring' },
];

const NOMBRES_NIVEL = { inicial: 'Inicial', basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado', competitivo: 'Competitivo' };
const COLORES_NIVEL = { inicial: 'bg-red-100 text-red-800', basico: 'bg-amber-100 text-amber-800', intermedio: 'bg-blue-100 text-blue-800', avanzado: 'bg-green-100 text-green-800', competitivo: 'bg-purple-100 text-purple-800' };

function calcularPromedio(puntajes) {
  const valores = Object.values(puntajes).filter(v => v != null && v >= 1 && v <= 10);
  if (valores.length === 0) return null;
  const suma = valores.reduce((a, b) => a + b, 0);
  return Math.round((suma / valores.length) * 100) / 100;
}

function calcularNivel(promedio) {
  if (promedio == null) return '';
  if (promedio < 4) return 'inicial';
  if (promedio < 6) return 'basico';
  if (promedio < 8) return 'intermedio';
  if (promedio < 9.5) return 'avanzado';
  return 'competitivo';
}

function EntrenadorProgreso() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [form, setForm] = useState({
    fecha_evaluacion: new Date().toISOString().slice(0, 10),
    nivel: '',
    tecnica: '', defensa: '', resistencia: '', velocidad: '', fuerza: '', disciplina: '', sparring: '',
    peso: '', observacion: '',
  });

  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historialData, setHistorialData] = useState([]);
  const [historialNombre, setHistorialNombre] = useState('');
  const [historialLoading, setHistorialLoading] = useState(false);

  const fetchAlumnos = async () => {
    setLoading(true);
    try {
      const data = await getMisAlumnosEntrenador();
      setAlumnos(data.alumnos || []);
    } catch {
      setError('Error al cargar alumnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlumnos(); }, []);

  const openForm = (alumno) => {
    setSelectedAlumno(alumno);
    setForm({
      fecha_evaluacion: new Date().toISOString().slice(0, 10),
      nivel: '',
      tecnica: '', defensa: '', resistencia: '', velocidad: '', fuerza: '', disciplina: '', sparring: '',
      peso: '', observacion: '',
    });
    setShowFormModal(true);
  };

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const puntajesActuales = {
    tecnica: form.tecnica ? Number(form.tecnica) : null,
    defensa: form.defensa ? Number(form.defensa) : null,
    resistencia: form.resistencia ? Number(form.resistencia) : null,
    velocidad: form.velocidad ? Number(form.velocidad) : null,
    fuerza: form.fuerza ? Number(form.fuerza) : null,
    disciplina: form.disciplina ? Number(form.disciplina) : null,
    sparring: form.sparring ? Number(form.sparring) : null,
  };
  const promedioActual = calcularPromedio(puntajesActuales);
  const nivelCalculado = form.nivel || calcularNivel(promedioActual);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlumno) return;
    try {
      const data = {
        alumno_id: selectedAlumno.alumno_id || selectedAlumno.id_usuario,
        fecha_evaluacion: form.fecha_evaluacion,
        nivel: nivelCalculado || 'basico',
        tecnica: form.tecnica ? Number(form.tecnica) : null,
        defensa: form.defensa ? Number(form.defensa) : null,
        resistencia: form.resistencia ? Number(form.resistencia) : null,
        velocidad: form.velocidad ? Number(form.velocidad) : null,
        fuerza: form.fuerza ? Number(form.fuerza) : null,
        disciplina: form.disciplina ? Number(form.disciplina) : null,
        sparring: form.sparring ? Number(form.sparring) : null,
        peso: form.peso ? Number(form.peso) : null,
        observacion: form.observacion || null,
      };
      await createProgreso(data);
      setSuccess(`Evaluación registrada: ${selectedAlumno.alumno_nombre}`);
      setShowFormModal(false);
      fetchAlumnos();
    } catch {
      setError('Error al registrar evaluación');
    }
  };

  const openHistorial = async (alumno) => {
    setHistorialNombre(alumno.alumno_nombre);
    setShowHistorialModal(true);
    setHistorialLoading(true);
    try {
      const data = await getHistorialProgreso(alumno.alumno_id || alumno.id_usuario);
      setHistorialData(data.historial || []);
    } catch {
      setHistorialData([]);
    } finally {
      setHistorialLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getNivelBadge = (nivel) => {
    const color = COLORES_NIVEL[nivel] || 'bg-gray-100 text-gray-800';
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Evaluación Deportiva</h2>
        <p className="text-gray-500 mt-1">Registra el progreso de tus alumnos</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">{success}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {alumnos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No tienes alumnos asignados</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Turno</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a) => (
                <tr key={a.id || a.alumno_id || a.id_usuario} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{a.alumno_nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{a.nombre_turno || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {a.estado_pago === 'pagado'
                      ? <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Habilitado</span>
                      : <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Pendiente</span>}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openForm(a)}
                      className="text-sm font-medium text-green-600 hover:text-green-800"
                    >
                      Registrar
                    </button>
                    <button
                      onClick={() => openHistorial(a)}
                      className="text-sm font-medium text-invictus-600 hover:text-invictus-800"
                    >
                      Historial
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showFormModal && selectedAlumno && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Registrar Evaluación</h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-800">{selectedAlumno.alumno_nombre}</p>
              <p className="text-xs text-gray-500">{selectedAlumno.nombre_turno || 'Sin turno'}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de evaluación</label>
                <input type="date" value={form.fecha_evaluacion}
                  onChange={(e) => handleInputChange('fecha_evaluacion', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {CAMPOS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label} (1-10)</label>
                    <input type="number" min="1" max="10" value={form[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Peso (kg)</label>
                  <input type="number" step="0.1" min="0" value={form.peso}
                    onChange={(e) => handleInputChange('peso', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-600 font-medium">Promedio: </span>
                  <span className="text-lg font-bold text-blue-800">{promedioActual ?? '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-blue-600 font-medium">Nivel: </span>
                  <span className="text-base font-semibold text-blue-800">{NOMBRES_NIVEL[nivelCalculado] || 'Automático'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nivel (manual, opcional)</label>
                <select value={form.nivel} onChange={(e) => handleInputChange('nivel', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Automático según promedio</option>
                  {Object.entries(NOMBRES_NIVEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Observación</label>
                <textarea value={form.observacion} onChange={(e) => handleInputChange('observacion', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows="2" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                  Guardar Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistorialModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Historial</h3>
                <p className="text-sm text-gray-500">{historialNombre}</p>
              </div>
              <button onClick={() => setShowHistorialModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            {historialLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
              </div>
            ) : historialData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Sin evaluaciones</div>
            ) : (
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="px-3 py-2 font-medium">Fecha</th>
                      <th className="px-3 py-2 font-medium text-center">Nivel</th>
                      <th className="px-3 py-2 font-medium text-center">Prom.</th>
                      <th className="px-3 py-2 font-medium">Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialData.map((h, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700">{formatDate(h.fecha_evaluacion)}</td>
                        <td className="px-3 py-2 text-center">{getNivelBadge(h.nivel)}</td>
                        <td className="px-3 py-2 text-center font-semibold text-gray-700">{h.promedio ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate" title={h.observacion}>{h.observacion || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => setShowHistorialModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EntrenadorProgreso;
