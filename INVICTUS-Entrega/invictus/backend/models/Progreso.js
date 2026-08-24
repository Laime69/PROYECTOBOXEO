const pool = require('../config/database');

class Progreso {
  static async crear({ alumno_id, entrenador_id, fecha_evaluacion, nivel, tecnica, defensa, resistencia, velocidad, fuerza, disciplina, sparring, peso, observacion }) {
    const result = await pool.query(
      `INSERT INTO progresos_alumnos (alumno_id, entrenador_id, fecha_evaluacion, nivel, tecnica, defensa, resistencia, velocidad, fuerza, disciplina, sparring, peso, observacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [alumno_id, entrenador_id || null, fecha_evaluacion || new Date(), nivel, tecnica || null, defensa || null, resistencia || null, velocidad || null, fuerza || null, disciplina || null, sparring || null, peso || null, observacion || null]
    );
    return result.rows[0];
  }

  static async findAll(filtros = {}) {
    let query = `SELECT p.*, u.nombre AS alumno_nombre, u.correo AS alumno_correo,
                 e.nombre AS entrenador_nombre,
                 ROUND(
                   COALESCE(
                     (p.tecnica::decimal + p.defensa::decimal + p.resistencia::decimal +
                      p.velocidad::decimal + p.fuerza::decimal + p.disciplina::decimal + p.sparring::decimal)
                     /
                     NULLIF(
                       (CASE WHEN p.tecnica IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.defensa IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.resistencia IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.velocidad IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.fuerza IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.disciplina IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.sparring IS NOT NULL THEN 1 ELSE 0 END),
                       0
                     ),
                     0
                   ), 2
                 ) AS promedio
                 FROM progresos_alumnos p
                 LEFT JOIN usuarios u ON p.alumno_id = u.id_usuario
                 LEFT JOIN usuarios e ON p.entrenador_id = e.id_usuario`;
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
    if (filtros.nivel) {
      condiciones.push(`p.nivel = $${idx++}`);
      params.push(filtros.nivel);
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
      `SELECT p.*, u.nombre AS alumno_nombre, u.correo AS alumno_correo,
       e.nombre AS entrenador_nombre,
       ROUND(
         COALESCE(
           (p.tecnica::decimal + p.defensa::decimal + p.resistencia::decimal +
            p.velocidad::decimal + p.fuerza::decimal + p.disciplina::decimal + p.sparring::decimal)
           /
           NULLIF(
             (CASE WHEN p.tecnica IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN p.defensa IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN p.resistencia IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN p.velocidad IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN p.fuerza IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN p.disciplina IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN p.sparring IS NOT NULL THEN 1 ELSE 0 END),
             0
           ),
           0
         ), 2
       ) AS promedio
       FROM progresos_alumnos p
       LEFT JOIN usuarios u ON p.alumno_id = u.id_usuario
       LEFT JOIN usuarios e ON p.entrenador_id = e.id_usuario
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByAlumno(alumnoId, limite = null) {
    let query = `SELECT p.*, e.nombre AS entrenador_nombre,
                 ROUND(
                   COALESCE(
                     (p.tecnica::decimal + p.defensa::decimal + p.resistencia::decimal +
                      p.velocidad::decimal + p.fuerza::decimal + p.disciplina::decimal + p.sparring::decimal)
                     /
                     NULLIF(
                       (CASE WHEN p.tecnica IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.defensa IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.resistencia IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.velocidad IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.fuerza IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.disciplina IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN p.sparring IS NOT NULL THEN 1 ELSE 0 END),
                       0
                     ),
                     0
                   ), 2
                 ) AS promedio
                 FROM progresos_alumnos p
                 LEFT JOIN usuarios e ON p.entrenador_id = e.id_usuario
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

  static async update(id, data) {
    const fields = [];
    const params = [];
    let idx = 1;

    if (data.nivel !== undefined) { fields.push(`nivel = $${idx++}`); params.push(data.nivel); }
    if (data.tecnica !== undefined) { fields.push(`tecnica = $${idx++}`); params.push(data.tecnica); }
    if (data.defensa !== undefined) { fields.push(`defensa = $${idx++}`); params.push(data.defensa); }
    if (data.resistencia !== undefined) { fields.push(`resistencia = $${idx++}`); params.push(data.resistencia); }
    if (data.velocidad !== undefined) { fields.push(`velocidad = $${idx++}`); params.push(data.velocidad); }
    if (data.fuerza !== undefined) { fields.push(`fuerza = $${idx++}`); params.push(data.fuerza); }
    if (data.disciplina !== undefined) { fields.push(`disciplina = $${idx++}`); params.push(data.disciplina); }
    if (data.sparring !== undefined) { fields.push(`sparring = $${idx++}`); params.push(data.sparring); }
    if (data.peso !== undefined) { fields.push(`peso = $${idx++}`); params.push(data.peso); }
    if (data.observacion !== undefined) { fields.push(`observacion = $${idx++}`); params.push(data.observacion); }
    if (data.fecha_evaluacion !== undefined) { fields.push(`fecha_evaluacion = $${idx++}`); params.push(data.fecha_evaluacion); }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) return null;

    params.push(id);
    const result = await pool.query(
      `UPDATE progresos_alumnos SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  }

  static async getResumenGeneral(filtros = {}) {
    let condiciones = [];
    const params = [];
    let idx = 1;

    if (filtros.turno) {
      condiciones.push(`ah.turno = $${idx++}`);
      params.push(filtros.turno);
    }
    if (filtros.entrenador_id) {
      condiciones.push(`h.entrenador_id = $${idx++}`);
      params.push(filtros.entrenador_id);
    }
    if (filtros.nivel) {
      condiciones.push(`p.nivel = $${idx++}`);
      params.push(filtros.nivel);
    }

    const whereJoin = condiciones.length > 0 ? ' AND ' + condiciones.join(' AND ') : '';

    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS total_evaluaciones,
        COUNT(DISTINCT p.alumno_id)::int AS total_alumnos_evaluados,
        ROUND(
          AVG(
            COALESCE(
              (p.tecnica::decimal + p.defensa::decimal + p.resistencia::decimal +
               p.velocidad::decimal + p.fuerza::decimal + p.disciplina::decimal + p.sparring::decimal)
              /
              NULLIF(
                (CASE WHEN p.tecnica IS NOT NULL THEN 1 ELSE 0 END +
                 CASE WHEN p.defensa IS NOT NULL THEN 1 ELSE 0 END +
                 CASE WHEN p.resistencia IS NOT NULL THEN 1 ELSE 0 END +
                 CASE WHEN p.velocidad IS NOT NULL THEN 1 ELSE 0 END +
                 CASE WHEN p.fuerza IS NOT NULL THEN 1 ELSE 0 END +
                 CASE WHEN p.disciplina IS NOT NULL THEN 1 ELSE 0 END +
                 CASE WHEN p.sparring IS NOT NULL THEN 1 ELSE 0 END),
                0
              ),
              0
            )
          ), 2
        ) AS promedio_general,
        COUNT(*) FILTER (WHERE p.nivel = 'inicial')::int AS alumnos_inicial,
        COUNT(*) FILTER (WHERE p.nivel = 'basico')::int AS alumnos_basico,
        COUNT(*) FILTER (WHERE p.nivel = 'intermedio')::int AS alumnos_intermedio,
        COUNT(*) FILTER (WHERE p.nivel = 'avanzado')::int AS alumnos_avanzado,
        COUNT(*) FILTER (WHERE p.nivel = 'competitivo')::int AS alumnos_competitivo
       FROM progresos_alumnos p
       LEFT JOIN alumno_horarios ah ON p.alumno_id = ah.alumno_id AND ah.estado = 'activo'
       LEFT JOIN horarios h ON ah.horario_id = h.id_horario
       WHERE 1=1${whereJoin}`,
      params
    );
    return result.rows[0];
  }

  static async getUltimaEvaluacionPorAlumno(filtros = {}) {
    let condiciones = [];
    const params = [];
    let idx = 1;

    if (filtros.turno) {
      condiciones.push(`h.turno = $${idx++}`);
      params.push(filtros.turno);
    }
    if (filtros.entrenador_id) {
      condiciones.push(`h.entrenador_id = $${idx++}`);
      params.push(filtros.entrenador_id);
    }
    if (filtros.nivel) {
      condiciones.push(`p.nivel = $${idx++}`);
      params.push(filtros.nivel);
    }

    const whereExtra = condiciones.length > 0 ? ' AND ' + condiciones.join(' AND ') : '';

    const result = await pool.query(
      `SELECT u.id_usuario AS alumno_id, u.nombre AS alumno_nombre, u.correo AS alumno_correo,
              p.id AS progreso_id, p.fecha_evaluacion, p.nivel, p.observacion,
              ROUND(
                COALESCE(
                  (p.tecnica::decimal + p.defensa::decimal + p.resistencia::decimal +
                   p.velocidad::decimal + p.fuerza::decimal + p.disciplina::decimal + p.sparring::decimal)
                  /
                  NULLIF(
                    (CASE WHEN p.tecnica IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN p.defensa IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN p.resistencia IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN p.velocidad IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN p.fuerza IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN p.disciplina IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN p.sparring IS NOT NULL THEN 1 ELSE 0 END),
                    0
                  ),
                  0
                ), 2
              ) AS promedio,
              ah.turno AS turno_asignado,
              CASE h.turno WHEN 'manana' THEN 'Mañana' WHEN 'tarde' THEN 'Tarde' WHEN 'noche' THEN 'Noche' END AS nombre_turno,
              h.entrenador_id, en.nombre AS entrenador_nombre
       FROM usuarios u
       LEFT JOIN alumno_horarios ah ON u.id_usuario = ah.alumno_id AND ah.estado = 'activo'
       LEFT JOIN horarios h ON ah.horario_id = h.id_horario
       LEFT JOIN LATERAL (
         SELECT * FROM progresos_alumnos
         WHERE alumno_id = u.id_usuario
         ORDER BY fecha_evaluacion DESC, created_at DESC
         LIMIT 1
       ) p ON true
       LEFT JOIN usuarios en ON h.entrenador_id = en.id_usuario
       WHERE u.rol = 'Alumno'${whereExtra}
       ORDER BY u.nombre`,
      params
    );
    return result.rows;
  }
}

module.exports = Progreso;
