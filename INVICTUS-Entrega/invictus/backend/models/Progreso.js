const pool = require('../config/database');

// Áreas evaluadas y sus indicadores (columna de BD => peso en el promedio del área)
const AREAS = {
  tecnica_ofensiva: {
    label: 'Técnica Ofensiva',
    campos: ['jab', 'directo', 'gancho', 'uppercut', 'combinaciones', 'precision_golpes'],
  },
  tecnica_defensiva: {
    label: 'Técnica Defensiva',
    campos: ['guardia', 'bloqueos', 'esquives', 'contragolpe', 'evitar_golpes'],
  },
  desplazamiento: {
    label: 'Desplazamiento',
    campos: ['juego_piernas', 'equilibrio', 'coordinacion', 'manejo_ring', 'control_distancia'],
  },
  condicion_fisica: {
    label: 'Condición Física',
    campos: ['resistencia', 'velocidad', 'fuerza', 'agilidad', 'recuperacion'],
  },
  sparring_tactica: {
    label: 'Sparring y Táctica',
    campos: ['estrategia', 'reaccion', 'control_emocional', 'aplicacion_tecnicas', 'rendimiento_asaltos'],
  },
  disciplina: {
    label: 'Disciplina',
    campos: ['asistencia_eval', 'puntualidad', 'esfuerzo', 'respeto', 'cumplimiento_instrucciones'],
  },
};

// Columnas de progresos_alumnos que aceptan puntajes 1-10 (todos los sub-indicadores)
const SCORE_COLUMNS = [
  'jab', 'directo', 'gancho', 'uppercut', 'combinaciones', 'precision_golpes',
  'guardia', 'bloqueos', 'esquives', 'contragolpe', 'evitar_golpes',
  'juego_piernas', 'equilibrio', 'coordinacion', 'manejo_ring', 'control_distancia',
  'resistencia', 'velocidad', 'fuerza', 'agilidad', 'recuperacion',
  'estrategia', 'reaccion', 'control_emocional', 'aplicacion_tecnicas', 'rendimiento_asaltos',
  'asistencia_eval', 'puntualidad', 'esfuerzo', 'respeto', 'cumplimiento_instrucciones',
];

// Calcula el promedio de los valores no nulos de una lista
function _promedioValores(valores) {
  const validos = valores.filter((v) => v != null && v >= 1 && v <= 10);
  if (validos.length === 0) return null;
  const suma = validos.reduce((a, b) => a + b, 0);
  return Math.round((suma / validos.length) * 100) / 100;
}

// Calcula todos los promedios (por área, general y porcentaje) a partir de un objeto de datos
function calcularPromedios(row) {
  const promedioAreas = {};
  for (const [clave, def] of Object.entries(AREAS)) {
    const valor = _promedioValores(def.campos.map((c) => row[c]));
    promedioAreas[clave] = valor;
  }

  const valoresArea = Object.values(promedioAreas).filter((v) => v != null);
  const promedioGeneral = valoresArea.length > 0
    ? Math.round((valoresArea.reduce((a, b) => a + b, 0) / valoresArea.length) * 100) / 100
    : null;
  const porcentajeProgreso = promedioGeneral != null
    ? Math.round((promedioGeneral / 10) * 10000) / 100
    : null;

  return { promedioAreas, promedioGeneral, porcentajeProgreso };
}

class Progreso {
  static AREAS = AREAS;
  static SCORE_COLUMNS = SCORE_COLUMNS;
  static calcularPromedios = calcularPromedios;

  static async crear(data) {
    const promedios = calcularPromedios(data);
    const result = await pool.query(
      `INSERT INTO evaluaciones_progreso (
         alumno_id, entrenador_id, fecha_evaluacion, nivel, nivel_deportivo, tipo_evaluacion, categoria_peso,
         peso, peso_anterior,
         jab, directo, gancho, uppercut, combinaciones, precision_golpes,
         guardia, bloqueos, esquives, contragolpe, evitar_golpes,
         juego_piernas, equilibrio, coordinacion, manejo_ring, control_distancia,
         resistencia, velocidad, fuerza, agilidad, recuperacion,
         estrategia, reaccion, control_emocional, aplicacion_tecnicas, rendimiento_asaltos,
         asistencia_eval, puntualidad, esfuerzo, respeto, cumplimiento_instrucciones,
         promedio_tecnica_ofensiva, promedio_tecnica_defensiva, promedio_desplazamiento,
         promedio_condicion_fisica, promedio_sparring_tactica, promedio_disciplina,
         promedio_general, porcentaje_progreso,
         fortalezas, aspectos_mejorar, observacion, recomendaciones, proximo_objetivo, proxima_evaluacion
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,
         $8,$9,
         $10,$11,$12,$13,$14,$15,
         $16,$17,$18,$19,$20,
         $21,$22,$23,$24,$25,
         $26,$27,$28,$29,$30,
         $31,$32,$33,$34,$35,
         $36,$37,$38,$39,$40,
         $41,$42,$43,$44,$45,$46,
         $47,$48,
         $49,$50,$51,$52,$53,$54
       ) RETURNING *`,
      [
        data.alumno_id, data.entrenador_id || null, data.fecha_evaluacion || new Date(), data.nivel || 'basico',
        data.nivel_deportivo || data.nivel || 'basico', data.tipo_evaluacion || 'mensual', data.categoria_peso || '',
        data.peso || null, data.peso_anterior || null,
        data.jab || null, data.directo || null, data.gancho || null, data.uppercut || null, data.combinaciones || null, data.precision_golpes || null,
        data.guardia || null, data.bloqueos || null, data.esquives || null, data.contragolpe || null, data.evitar_golpes || null,
        data.juego_piernas || null, data.equilibrio || null, data.coordinacion || null, data.manejo_ring || null, data.control_distancia || null,
        data.resistencia || null, data.velocidad || null, data.fuerza || null, data.agilidad || null, data.recuperacion || null,
        data.estrategia || null, data.reaccion || null, data.control_emocional || null, data.aplicacion_tecnicas || null, data.rendimiento_asaltos || null,
        data.disciplina !== undefined ? data.disciplina : (data.asistencia_eval || null),
        data.puntualidad || null, data.esfuerzo || null, data.respeto || null, data.cumplimiento_instrucciones || null,
        promedios.promedioAreas.tecnica_ofensiva, promedios.promedioAreas.tecnica_defensiva, promedios.promedioAreas.desplazamiento,
        promedios.promedioAreas.condicion_fisica, promedios.promedioAreas.sparring_tactica, promedios.promedioAreas.disciplina,
        promedios.promedioGeneral, promedios.porcentajeProgreso,
        data.fortalezas || '', data.aspectos_mejorar || '', data.observacion || '', data.recomendaciones || '',
        data.proximo_objetivo || '', data.proxima_evaluacion || null,
      ]
    );
    return result.rows[0];
  }

  static async findAll(filtros = {}) {
    let query = `SELECT p.*, u.id_usuario AS alumno_id_usuario,
                 u.nombre AS alumno_nombre, u.correo AS alumno_correo, al.ci AS alumno_ci,
                 al.fecha_nacimiento,
                 e.nombre AS entrenador_nombre
                 FROM evaluaciones_progreso p
                 LEFT JOIN alumnos al ON al.id_alumno = p.alumno_id
                 LEFT JOIN usuarios u ON u.id_usuario = al.usuario_id
                 LEFT JOIN entrenadores etr ON etr.id_entrenador = p.entrenador_id
                 LEFT JOIN usuarios e ON e.id_usuario = etr.usuario_id`;
    const condiciones = [];
    const params = [];
    let idx = 1;

    if (filtros.alumno_id) {
      condiciones.push(`p.alumno_id = $${idx++}`);
      params.push(filtros.alumno_id);
    }
    if (filtros.alumno_ids && Array.isArray(filtros.alumno_ids)) {
      condiciones.push(`p.alumno_id = ANY($${idx++})`);
      params.push(filtros.alumno_ids);
    }
    if (filtros.entrenador_id) {
      condiciones.push(`p.entrenador_id = $${idx++}`);
      params.push(filtros.entrenador_id);
    }
    if (filtros.nivel && filtros.nivel !== 'todos') {
      condiciones.push(`(p.nivel = $${idx} OR p.nivel_deportivo = $${idx})`);
      params.push(filtros.nivel);
      idx++;
    }
    if (filtros.tipo_evaluacion) {
      condiciones.push(`p.tipo_evaluacion = $${idx++}`);
      params.push(filtros.tipo_evaluacion);
    }
    if (filtros.fecha_desde) {
      condiciones.push(`p.fecha_evaluacion >= $${idx++}`);
      params.push(filtros.fecha_desde);
    }
    if (filtros.fecha_hasta) {
      condiciones.push(`p.fecha_evaluacion <= $${idx++}`);
      params.push(filtros.fecha_hasta);
    }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }
    query += ' ORDER BY p.fecha_evaluacion DESC, p.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT p.*, u.id_usuario AS alumno_id_usuario,
       u.nombre AS alumno_nombre, u.correo AS alumno_correo, al.ci AS alumno_ci,
       al.fecha_nacimiento,
       e.nombre AS entrenador_nombre
       FROM evaluaciones_progreso p
       LEFT JOIN alumnos al ON al.id_alumno = p.alumno_id
       LEFT JOIN usuarios u ON u.id_usuario = al.usuario_id
       LEFT JOIN entrenadores etr ON etr.id_entrenador = p.entrenador_id
       LEFT JOIN usuarios e ON e.id_usuario = etr.usuario_id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByAlumno(alumnoId, limite = null) {
    let query = `SELECT p.*, e.nombre AS entrenador_nombre
                 FROM evaluaciones_progreso p
                 LEFT JOIN entrenadores etr ON etr.id_entrenador = p.entrenador_id
                 LEFT JOIN usuarios e ON e.id_usuario = etr.usuario_id
                 WHERE p.alumno_id = $1
                 ORDER BY p.fecha_evaluacion DESC, p.created_at DESC`;
    const params = [alumnoId];
    if (limite) {
      query += ` LIMIT $2`;
      params.push(limite);
    }
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async esUltimaEvaluacion(alumnoId, id) {
    const result = await pool.query(
      `SELECT NOT EXISTS (
         SELECT 1 FROM evaluaciones_progreso
         WHERE alumno_id = $1 AND id <> $2
           AND (fecha_evaluacion, created_at, id) >
               (SELECT fecha_evaluacion, created_at, id FROM evaluaciones_progreso WHERE id = $2)
       ) AS es_ultima`,
      [alumnoId, id]
    );
    return !!(result.rows[0] && result.rows[0].es_ultima);
  }

  static async update(id, data) {
    const allowed = new Set([
      'entrenador_id', 'fecha_evaluacion', 'nivel', 'nivel_deportivo', 'tipo_evaluacion', 'categoria_peso',
      'peso', 'peso_anterior', ...SCORE_COLUMNS, 'disciplina',
      'promedio_tecnica_ofensiva', 'promedio_tecnica_defensiva', 'promedio_desplazamiento',
      'promedio_condicion_fisica', 'promedio_sparring_tactica', 'promedio_disciplina',
      'promedio_general', 'porcentaje_progreso',
      'fortalezas', 'aspectos_mejorar', 'observacion', 'recomendaciones', 'proximo_objetivo', 'proxima_evaluacion',
    ]);

    const fields = [];
    const params = [];
    let idx = 1;

    for (const [clave, valor] of Object.entries(data)) {
      if (allowed.has(clave) && valor !== undefined) {
        fields.push(`${clave} = $${idx++}`);
        params.push(valor);
      }
    }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) return null;

    params.push(id);
    const result = await pool.query(
      `UPDATE evaluaciones_progreso SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  }

  static async deleteById(id) {
    const result = await pool.query(
      'DELETE FROM evaluaciones_progreso WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  }

  // Lista alumnos (usuarios rol Alumno) con su última evaluación y datos relacionados
  static async listarAlumnosConUltimoProgreso(filtros = {}) {
    let condiciones = [];
    const params = [];
    let idx = 1;

    if (filtros.busqueda && filtros.busqueda.trim()) {
      const term = `%${filtros.busqueda.trim()}%`;
      condiciones.push(`(u.nombre ILIKE $${idx} OR al.ci ILIKE $${idx})`);
      params.push(term);
      idx++;
    }
    if (filtros.turno) {
      condiciones.push(`h.nombre_turno = $${idx++}`);
      params.push(filtros.turno);
    }
    if (filtros.nivel && filtros.nivel !== 'todos') {
      condiciones.push(`pa.nivel_deportivo = $${idx++}`);
      params.push(filtros.nivel);
    }

    const whereJoin = condiciones.length > 0 ? ' AND ' + condiciones.join(' AND ') : '';

    const result = await pool.query(
      `SELECT
         al.id_alumno AS alumno_id,
         u.id_usuario AS alumno_id_usuario,
         u.nombre AS alumno_nombre,
         u.correo AS alumno_correo,
         al.ci AS alumno_ci,
         al.fecha_nacimiento,
         al.nivel_deportivo,
         al.peso_actual,
         al.fecha_inscripcion,
         al.estado_pago,
         al.contacto_emergencia,
         al.celular_contacto_emergencia,
         al.objetivo_entrenamiento,
         al.observacion_medica,
         h.nombre_turno AS turno_asignado,
         CASE h.nombre_turno WHEN 'manana' THEN 'Mañana' WHEN 'tarde' THEN 'Tarde' WHEN 'noche' THEN 'Noche' END AS nombre_turno,
         ent.id_entrenador AS entrenador_id,
         en.nombre AS entrenador_nombre,
         p.id AS progreso_id,
         p.fecha_evaluacion AS ultima_evaluacion,
         p.nivel AS nivel_evaluacion,
         p.peso AS ultimo_peso,
         p.categoria_peso,
         p.promedio_general,
         p.porcentaje_progreso,
         p.promedio_tecnica_ofensiva,
         p.promedio_tecnica_defensiva,
         p.promedio_desplazamiento,
         p.promedio_condicion_fisica,
         p.promedio_sparring_tactica,
         p.promedio_disciplina,
         p.fortalezas, p.aspectos_mejorar, p.recomendaciones, p.proximo_objetivo,
         p.tipo_evaluacion, p.observacion, p.peso_anterior, p.proxima_evaluacion, p.nivel_deportivo AS nivel_deportivo_eval,
         a.asis_total, a.asis_presentes, a.porcentaje_asistencia,
         prev.promedio_general AS promedio_anterior,
         prev.porcentaje_progreso AS porcentaje_anterior,
         prev.fecha_evaluacion AS fecha_anterior
FROM usuarios u
        JOIN roles r ON r.id_rol = u.rol_id
        JOIN alumnos al ON al.usuario_id = u.id_usuario
        LEFT JOIN alumno_horarios ah ON al.id_alumno = ah.alumno_id AND ah.estado = 'activo'
        LEFT JOIN horarios h ON ah.horario_id = h.id_horario
        LEFT JOIN entrenadores ent ON ent.id_entrenador = h.entrenador_id
        LEFT JOIN usuarios en ON en.id_usuario = ent.usuario_id
        LEFT JOIN LATERAL (
          SELECT * FROM evaluaciones_progreso x
          WHERE x.alumno_id = al.id_alumno
          ORDER BY x.fecha_evaluacion DESC, x.created_at DESC
          LIMIT 1
        ) p ON true
        LEFT JOIN LATERAL (
          SELECT * FROM evaluaciones_progreso x
          WHERE x.alumno_id = al.id_alumno
          ORDER BY x.fecha_evaluacion DESC, x.created_at DESC
          OFFSET 1 LIMIT 1
        ) prev ON true
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::int AS asis_total,
            COUNT(*) FILTER (WHERE x2.estado = 'presente')::int AS asis_presentes,
            ROUND(COUNT(*) FILTER (WHERE x2.estado = 'presente')::decimal
                  / NULLIF(COUNT(*), 0) * 100, 1) AS porcentaje_asistencia
          FROM asistencias x2
          WHERE x2.alumno_id = al.id_alumno
        ) a ON true
        WHERE r.nombre = 'Alumno' AND u.estado = 'activo'${whereJoin}
       ORDER BY u.nombre`,
      params
    );
    return result.rows;
  }

  static async getResumenGeneral(filtros = {}) {
    let condiciones = [];
    const params = [];
    let idx = 1;

    if (filtros.turno) {
      condiciones.push(`h.nombre_turno = $${idx++}`);
      params.push(filtros.turno);
    }
    if (filtros.entrenador_id) {
      condiciones.push(`h.entrenador_id = $${idx++}`);
      params.push(filtros.entrenador_id);
    }
    if (filtros.nivel && filtros.nivel !== 'todos') {
      condiciones.push(`al.nivel_deportivo = $${idx++}`);
      params.push(filtros.nivel);
    }

    const whereJoin = condiciones.length > 0 ? ' AND ' + condiciones.join(' AND ') : '';

    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS total_evaluaciones,
        COUNT(DISTINCT p.alumno_id)::int AS total_alumnos_evaluados,
        ROUND(AVG(NULLIF(p.promedio_general, 0)), 2) AS promedio_general,
        ROUND(AVG(NULLIF(p.porcentaje_progreso, 0)), 2) AS porcentaje_general,
        COUNT(*) FILTER (WHERE COALESCE(al.nivel_deportivo, '') = 'principiante')::int AS alumnos_principiante,
        COUNT(*) FILTER (WHERE COALESCE(al.nivel_deportivo, '') = 'intermedio')::int AS alumnos_intermedio,
        COUNT(*) FILTER (WHERE COALESCE(al.nivel_deportivo, '') = 'avanzado')::int AS alumnos_avanzado,
        COUNT(*) FILTER (WHERE COALESCE(al.nivel_deportivo, '') = 'competitivo')::int AS alumnos_competitivo
       FROM evaluaciones_progreso p
       JOIN alumnos al ON al.id_alumno = p.alumno_id
       JOIN usuarios u ON u.id_usuario = al.usuario_id
       LEFT JOIN alumno_horarios ah ON al.id_alumno = ah.alumno_id AND ah.estado = 'activo'
       LEFT JOIN horarios h ON ah.horario_id = h.id_horario
       WHERE 1=1${whereJoin}`,
      params
    );
    return result.rows[0];
  }

  static async countEvaluaciones(alumnoId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total FROM evaluaciones_progreso WHERE alumno_id = $1`,
      [alumnoId]
    );
    return result.rows[0].total;
  }
}

module.exports = Progreso;
