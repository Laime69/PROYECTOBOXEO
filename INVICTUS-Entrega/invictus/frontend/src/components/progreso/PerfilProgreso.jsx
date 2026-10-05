import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
} from 'recharts';
import LoadingSpinner from '../LoadingSpinner';
import ReportPDFPreview from '../ReportPDFPreview';
import {
  AREAS_EVALUACION,
  NOMBRES_NIVEL_DEPORTIVO,
  COLORES_NIVEL_DEPORTIVO,
  ESTADOS_PROGRESO,
  NOMBRES_TURNO,
  formatearFecha,
} from '../../utils/progresoUtils';
import { getPerfilProgreso, getGraficosProgreso } from '../../services/progresoService';

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return '—';
  const nac = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function PerfilProgreso({ alumnoId, onClose, onRegistrarEvaluacion, readOnly = false }) {
  const [data, setData] = useState(null);
  const [graficos, setGraficos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [docPreview, setDocPreview] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const [perfil, graf] = await Promise.all([
          getPerfilProgreso(alumnoId),
          getGraficosProgreso(alumnoId),
        ]);
        setData(perfil);
        setGraficos(graf);
      } catch {
        setError('Error al cargar el perfil de progreso');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [alumnoId]);

  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape' && !readOnly) onClose();
    };
    window.addEventListener('keydown', manejarTecla);
    document.body.style.overflow = readOnly ? '' : 'hidden';
    return () => {
      window.removeEventListener('keydown', manejarTecla);
      document.body.style.overflow = '';
    };
  }, [onClose, readOnly]);

  if (!alumnoId) return null;
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#071A2B]/60 backdrop-blur-sm flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const alumno = data?.alumno;
  const ultima = data?.ultima_evaluacion;
  const estado = data?.estado_progreso || 'Sin evaluación';
  const estadoCfg = ESTADOS_PROGRESO[estado] || ESTADOS_PROGRESO['Sin evaluación'];
  const promediosAreas = data?.promedios_areas;

  const datosRadar = AREAS_EVALUACION.map((area) => ({
    area: area.label,
    valor: promediosAreas?.[area.clave] ?? 0,
  }));

  const datosLinea = (graficos?.evolucion_promedio || []).map((p) => ({
    fecha: formatearFecha(p.fecha),
    porcentaje: p.porcentaje ?? 0,
    promedio: p.promedio ?? 0,
  }));

  const datosPeso = (graficos?.evolucion_peso || [])
    .map((p) => ({ fecha: formatearFecha(p.fecha), peso: p.peso ?? 0 }))
    .filter((p) => Number.isFinite(Number(p.peso)) && Number(p.peso) > 0);

  const barraProgreso = ultima?.porcentaje_progreso != null
    ? Number(ultima.porcentaje_progreso)
    : null;

  const construirDocPreview = () => {
    const informe = [
      ultima?.fortalezas && ['Fortalezas', ultima.fortalezas],
      ultima?.aspectos_mejorar && ['Aspectos a mejorar', ultima.aspectos_mejorar],
      ultima?.recomendaciones && ['Recomendaciones', ultima.recomendaciones],
      ultima?.proximo_objetivo && ['Próximo objetivo', ultima.proximo_objetivo],
      ultima?.observacion && ['Observación', ultima.observacion],
    ].filter(Boolean);

    const doc = {
      titulo: 'Perfil de Progreso',
      periodo: alumno?.alumno_nombre,
      filtros: [
        { etiqueta: 'CI', valor: alumno?.alumno_ci || '—' },
        { etiqueta: 'Nivel deportivo', valor: NOMBRES_NIVEL_DEPORTIVO[ultima?.nivel_deportivo || alumno?.nivel_deportivo] || '—' },
        { etiqueta: 'Turno', valor: alumno?.nombre_turno || '—' },
        { etiqueta: 'Entrenador', valor: alumno?.entrenador_nombre || '—' },
        { etiqueta: 'Estado', valor: estado },
      ],
      resumen: [
        { etiqueta: 'Promedio general', valor: ultima?.promedio_general ?? '—' },
        { etiqueta: '% de progreso', valor: ultima?.porcentaje_progreso != null ? `${ultima.porcentaje_progreso}%` : '—', color: '#00A878' },
        { etiqueta: 'Diferencia', valor: data?.diferencia == null ? '—' : `${data.diferencia > 0 ? '+' : ''}${data.diferencia}%` },
        { etiqueta: 'Asistencia', valor: alumno?.porcentaje_asistencia != null ? `${alumno.porcentaje_asistencia}%` : '—' },
        { etiqueta: 'Última evaluación', valor: formatearFecha(ultima?.fecha_evaluacion) },
      ],
      graficos: [
        ...(datosLinea.length ? [{
          tipo: 'linea',
          titulo: 'Evolución del promedio general',
          color: '#00A878',
          unidad: '%',
          maximo: 100,
          puntos: datosLinea.map((p) => ({ etiqueta: p.fecha, valor: p.porcentaje })),
        }] : []),
        ...(ultima ? [{
          tipo: 'radar',
          titulo: 'Comparativa por áreas',
          color: '#00A878',
          categorias: AREAS_EVALUACION.map((a) => a.label),
          valores: AREAS_EVALUACION.map((a) => promediosAreas?.[a.clave] ?? 0),
        }] : []),
        ...(datosPeso.length ? [{
          tipo: 'linea',
          titulo: 'Evolución del peso',
          color: '#4C86F7',
          unidad: 'kg',
          maximo: null,
          puntos: datosPeso.map((p) => ({ etiqueta: p.fecha, valor: p.peso })),
        }] : []),
      ],
      secciones: [
        {
          titulo: 'Promedios por área',
          columnas: ['Área', 'Promedio'],
          filas: AREAS_EVALUACION.map((a) => [a.label, promediosAreas?.[a.clave] ?? '—']),
        },
        ...(datosLinea.length ? [{
          titulo: 'Evolución del progreso',
          columnas: ['Fecha', 'Promedio', '% Progreso'],
          filas: datosLinea.map((p) => [p.fecha, p.promedio ?? '—', p.porcentaje != null ? `${p.porcentaje}%` : '—']),
        }] : []),
        ...(datosPeso.length ? [{
          titulo: 'Evolución del peso',
          columnas: ['Fecha', 'Peso (kg)'],
          filas: datosPeso.map((p) => [p.fecha, p.peso ?? '—']),
        }] : []),
        ...(informe.length ? [{
          titulo: 'Informe del entrenador',
          columnas: ['Campo', 'Detalle'],
          filas: informe,
        }] : []),
      ],
    };
    setDocPreview(doc);
    setPreviewOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#071A2B]/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="max-w-5xl mx-auto my-6 bg-white rounded-2xl shadow-modal overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-[#172033]">Perfil de Progreso</h3>
            <p className="text-sm text-slate-500">{alumno?.alumno_nombre}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={construirDocPreview} className="bg-white border border-gray-300 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-5.414-5.414A2 2 0 0011.586 2H7a2 2 0 00-2 2v15a2 2 0 002 2z" /></svg>
              Vista previa PDF
            </button>
            {onRegistrarEvaluacion && !readOnly && (
              <button onClick={() => onRegistrarEvaluacion()} className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700">
                Nueva evaluación
              </button>
            )}
            {!readOnly && (
              <button onClick={onClose} className="text-gray-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            )}
          </div>
        </div>

        {error && <div className="m-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="p-6 space-y-6">
          {/* ── Cabecera del alumno ── */}
          <div className="flex flex-wrap items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-invictus-100 text-invictus-700 flex items-center justify-center text-3xl font-bold shrink-0">
              {(alumno?.alumno_nombre || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-3 flex-wrap">
                <h4 className="text-xl font-bold text-[#172033]">{alumno?.alumno_nombre}</h4>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  COLORES_NIVEL_DEPORTIVO[ultima?.nivel_deportivo || alumno?.nivel_deportivo] || 'bg-gray-100 text-gray-700'
                }`}>
                  {NOMBRES_NIVEL_DEPORTIVO[ultima?.nivel_deportivo || alumno?.nivel_deportivo] || '—'}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoCfg.color}`}>{estado}</span>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-slate-600">
                <span><strong className="text-[#172033]">CI:</strong> {alumno?.alumno_ci || '—'}</span>
                <span><strong className="text-[#172033]">Edad:</strong> {calcularEdad(alumno?.fecha_nacimiento)} años</span>
                <span><strong className="text-[#172033]">Ingreso:</strong> {formatearFecha(alumno?.fecha_inscripcion)}</span>
                <span><strong className="text-[#172033]">Turno:</strong> {alumno?.nombre_turno || '—'}</span>
                <span><strong className="text-[#172033]">Entrenador:</strong> {alumno?.entrenador_nombre || '—'}</span>
              </div>
            </div>
          </div>

          {/* ── Tarjetas de resumen ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
              <p className="text-xs text-slate-500 font-medium">Promedio general</p>
              <p className="text-2xl font-bold text-[#172033] mt-1">{ultima?.promedio_general ?? '—'}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
              <p className="text-xs text-slate-500 font-medium">% de progreso</p>
              <p className="text-2xl font-bold text-[#172033] mt-1">{ultima?.porcentaje_progreso ?? 0}%</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
              <p className="text-xs text-slate-500 font-medium">Diferencia vs anterior</p>
              <p className={`text-2xl font-bold mt-1 ${data?.diferencia == null ? 'text-gray-400' : data?.diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data?.diferencia == null ? '—' : `${data.diferencia > 0 ? '+' : ''}${data.diferencia}%`}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
              <p className="text-xs text-slate-500 font-medium">Última evaluación</p>
              <p className="text-lg font-bold text-[#172033] mt-1">{formatearFecha(ultima?.fecha_evaluacion)}</p>
            </div>
          </div>

          {/* Barra de progreso */}
          {barraProgreso != null && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Progreso general</span>
                <span className="text-sm font-bold text-[#172033]">{barraProgreso}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-invictus-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(barraProgreso, 100)}%` }} />
              </div>
            </div>
          )}

          {/* Asistencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
              <p className="text-sm font-medium text-slate-500 mb-2">Asistencia</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[#172033]">{alumno?.porcentaje_asistencia ?? 0}%</span>
                <span className="text-xs text-slate-400">{alumno?.asm_total ?? alumno?.porcentaje_asistencia != null ? 'presencias totales' : ''}</span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
              <p className="text-sm font-medium text-slate-500 mb-2">Peso actual / categoría</p>
              <p className="text-2xl font-bold text-[#172033]">{ultima?.peso ?? alumno?.peso_actual ?? '—'} kg <span className="text-sm font-medium text-slate-500">· {ultima?.categoria_peso || '—'}</span></p>
            </div>
          </div>

          {/* ── Tarjetas de promedios por área ── */}
          <div>
            <h4 className="font-semibold text-[#172033] mb-3">Promedios por área</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {AREAS_EVALUACION.map((area) => {
                const valor = promediosAreas?.[area.clave];
                return (
                  <div key={area.clave} className="border rounded-xl p-3 text-center" style={{ borderColor: `${area.color}33`, background: `${area.color}0d` }}>
                    <span className="text-lg">{area.icono}</span>
                    <p className="text-[11px] text-slate-500 mt-1 leading-tight">{area.label}</p>
                    <p className="text-xl font-bold mt-1" style={{ color: area.color }}>{valor ?? '—'}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Gráficos ── */}
          {datosLinea.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
              <h4 className="font-semibold text-[#172033] mb-2">Evolución del promedio general</h4>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={datosLinea} margin={{ top: 10, right: 20, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="porcentaje" name="% Progreso" stroke="#00A878" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {datosRadar.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
              <h4 className="font-semibold text-[#172033] mb-2">Comparativa por áreas</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={datosRadar} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="area" tick={{ fontSize: 11 }} />
                  <Radar name="Promedio" dataKey="valor" stroke="#00A878" fill="#00A878" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {datosPeso.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card">
              <h4 className="font-semibold text-[#172033] mb-2">Evolución del peso</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={datosPeso} margin={{ top: 10, right: 20, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#4C86F7" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Textos descriptivos ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[{ titulo: 'Fortalezas', valor: ultima?.fortalezas }, { titulo: 'Aspectos por mejorar', valor: ultima?.aspectos_mejorar }, { titulo: 'Recomendaciones', valor: ultima?.recomendaciones }, { titulo: 'Próximo objetivo', valor: ultima?.proximo_objetivo }].map((bloque) => (
              bloque.valor ? (
                <div key={bloque.titulo} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h5 className="font-semibold text-[#172033] text-sm mb-1">{bloque.titulo}</h5>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{bloque.valor}</p>
                </div>
              ) : null
            ))}
          </div>

          {ultima?.observacion && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <span className="font-semibold">Observación del entrenador: </span>{ultima.observacion}
            </div>
          )}

          {!ultima && (
            <div className="text-center py-8 text-slate-500">Este alumno aún no tiene evaluaciones registradas.</div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-5 py-2 text-sm text-slate-500 hover:text-[#172033] border border-gray-300 rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
      <ReportPDFPreview open={previewOpen} onClose={() => setPreviewOpen(false)} doc={docPreview} />
    </div>
  );
}

export default PerfilProgreso;
