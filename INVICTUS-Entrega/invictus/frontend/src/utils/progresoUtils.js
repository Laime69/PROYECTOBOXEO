// ── Constantes del módulo de progreso ─────────────────────────

export const MARGEN_ESTABLE = 3; // puntos porcentuales

// Áreas evaluadas con sus indicadores
export const AREAS_EVALUACION = [
  {
    clave: 'tecnica_ofensiva',
    label: 'Técnica Ofensiva',
    icono: '🥊',
    color: '#00A878',
    campos: [
      { clave: 'jab', label: 'Jab' },
      { clave: 'directo', label: 'Directo' },
      { clave: 'gancho', label: 'Gancho' },
      { clave: 'uppercut', label: 'Uppercut' },
      { clave: 'combinaciones', label: 'Combinaciones' },
      { clave: 'precision_golpes', label: 'Precisión' },
    ],
  },
  {
    clave: 'tecnica_defensiva',
    label: 'Técnica Defensiva',
    icono: '🛡️',
    color: '#4C86F7',
    campos: [
      { clave: 'guardia', label: 'Guardia' },
      { clave: 'bloqueos', label: 'Bloqueos' },
      { clave: 'esquives', label: 'Esquives' },
      { clave: 'contragolpe', label: 'Contragolpe' },
      { clave: 'evitar_golpes', label: 'Evitar golpes' },
    ],
  },
  {
    clave: 'desplazamiento',
    label: 'Desplazamiento',
    icono: '👟',
    color: '#F59E0B',
    campos: [
      { clave: 'juego_piernas', label: 'Juego de piernas' },
      { clave: 'equilibrio', label: 'Equilibrio' },
      { clave: 'coordinacion', label: 'Coordinación' },
      { clave: 'manejo_ring', label: 'Manejo del ring' },
      { clave: 'control_distancia', label: 'Control de distancia' },
    ],
  },
  {
    clave: 'condicion_fisica',
    label: 'Condición Física',
    icono: '💪',
    color: '#EF4444',
    campos: [
      { clave: 'resistencia', label: 'Resistencia' },
      { clave: 'velocidad', label: 'Velocidad' },
      { clave: 'fuerza', label: 'Fuerza' },
      { clave: 'agilidad', label: 'Agilidad' },
      { clave: 'recuperacion', label: 'Recuperación física' },
    ],
  },
  {
    clave: 'sparring_tactica',
    label: 'Sparring y Táctica',
    icono: '🆚',
    color: '#8B5CF6',
    campos: [
      { clave: 'estrategia', label: 'Estrategia' },
      { clave: 'reaccion', label: 'Reacción' },
      { clave: 'control_emocional', label: 'Control emocional' },
      { clave: 'aplicacion_tecnicas', label: 'Aplicación de técnicas' },
      { clave: 'rendimiento_asaltos', label: 'Rendimiento en asaltos' },
    ],
  },
  {
    clave: 'disciplina',
    label: 'Disciplina',
    icono: '📏',
    color: '#06B6D4',
    campos: [
      { clave: 'asistencia_eval', label: 'Asistencia' },
      { clave: 'puntualidad', label: 'Puntualidad' },
      { clave: 'esfuerzo', label: 'Esfuerzo' },
      { clave: 'respeto', label: 'Respeto' },
      { clave: 'cumplimiento_instrucciones', label: 'Cumplimiento de instrucciones' },
    ],
  },
];

export const NIVELES_EVALUACION = ['inicial', 'basico', 'intermedio', 'avanzado', 'competitivo'];
export const NOMBRES_NIVEL = {
  inicial: 'Inicial',
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  competitivo: 'Competitivo',
};
export const COLORES_NIVEL = {
  inicial: 'bg-red-100 text-red-800',
  basico: 'bg-amber-100 text-amber-800',
  intermedio: 'bg-blue-100 text-blue-800',
  avanzado: 'bg-green-100 text-green-800',
  competitivo: 'bg-purple-100 text-purple-800',
};

export const NIVELES_DEPORTIVOS = ['principiante', 'intermedio', 'avanzado', 'competitivo'];
export const NOMBRES_NIVEL_DEPORTIVO = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  competitivo: 'Competitivo',
};
export const COLORES_NIVEL_DEPORTIVO = {
  principiante: 'bg-slate-100 text-slate-700',
  intermedio: 'bg-blue-100 text-blue-800',
  avanzado: 'bg-green-100 text-green-800',
  competitivo: 'bg-purple-100 text-purple-800',
};

export const TIPOS_EVALUACION = ['inicial', 'mensual', 'trimestral', 'especial', 'competencia'];
export const NOMBRES_TIPO_EVALUACION = {
  inicial: 'Inicial',
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  especial: 'Especial',
  competencia: 'Previa a competencia',
};

export const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

// ── Categorías de peso genéricas (kg) ─────────────────────────
export function calcularCategoriaPeso(peso) {
  if (peso == null || Number(peso) <= 0) return 'Sin categoría';
  const p = Number(peso);
  if (p <= 52) return 'Mosca';
  if (p <= 57) return 'Gallo';
  if (p <= 60) return 'Pluma';
  if (p <= 63.5) return 'Ligero';
  if (p <= 67) return 'Superligero';
  if (p <= 71) return 'Welter';
  if (p <= 75) return 'Superwelter';
  if (p <= 80) return 'Medio';
  if (p <= 86) return 'Semipesado';
  return 'Pesado';
}

// ── Cálculo de promedios (centralizado) ───────────────────────
export function calcularPromedioValores(valores) {
  const validos = valores.filter((v) => v != null && v !== '' && Number(v) >= 1 && Number(v) <= 10);
  if (validos.length === 0) return null;
  const suma = validos.reduce((a, b) => a + Number(b), 0);
  return Math.round((suma / validos.length) * 100) / 100;
}

// Calcula promedio por área a partir de un objeto de puntuaciones
export function calcularPromediosAreas(data) {
  const resultado = {};
  AREAS_EVALUACION.forEach((area) => {
    resultado[area.clave] = calcularPromedioValores(area.campos.map((c) => data[c.clave]));
  });
  return resultado;
}

// Calcula promedio general (promedio de los promedios de área)
export function calcularPromedioGeneral(data) {
  const promedios = calcularPromediosAreas(data);
  const valores = Object.values(promedios).filter((v) => v != null);
  if (valores.length === 0) return null;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 100) / 100;
}

// Convierte promedio (sobre 10) a porcentaje
export function promedioAPorcentaje(promedio) {
  if (promedio == null) return null;
  return Math.round((promedio / 10) * 10000) / 100;
}

// Determina el estado del progreso comparando la evaluación actual con la anterior
export function calcularEstadoProgreso(porcentajeActual, porcentajeAnterior) {
  if (porcentajeActual == null) return 'Sin evaluación';
  if (porcentajeAnterior == null) return 'Primera evaluación';
  if (porcentajeActual - porcentajeAnterior > MARGEN_ESTABLE) return 'Mejorando';
  if (porcentajeAnterior - porcentajeActual > MARGEN_ESTABLE) return 'Requiere atención';
  return 'Estable';
}

// ── Estados: colores y etiquetas ──────────────────────────────
export const ESTADOS_PROGRESO = {
  Mejorando: { label: 'Mejorando', color: 'bg-green-100 text-green-800' },
  Estable: { label: 'Estable', color: 'bg-blue-100 text-blue-800' },
  'Requiere atención': { label: 'Requiere atención', color: 'bg-red-100 text-red-800' },
  'Sin evaluación': { label: 'Sin evaluación', color: 'bg-gray-100 text-gray-600' },
  'Primera evaluación': { label: 'Primera evaluación', color: 'bg-amber-100 text-amber-800' },
};

export function colorearEstrella(puntaje) {
  if (puntaje == null) return 'text-gray-300';
  if (puntaje <= 3) return 'text-red-500';
  if (puntaje <= 6) return 'text-amber-500';
  return 'text-green-600';
}

export function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatearFechaHora(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
