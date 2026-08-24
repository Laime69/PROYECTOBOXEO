const pool = require('../config/database');

const HORARIO_LABELS = `
  CASE h.turno WHEN 'manana' THEN 'Mañana' WHEN 'tarde' THEN 'Tarde' WHEN 'noche' THEN 'Noche' END AS nombre_turno,
  CASE LOWER(h.dia_semana) WHEN 'miercoles' THEN 'Miércoles' ELSE INITCAP(h.dia_semana) END AS dia,
  'Lunes a Viernes' AS dias`;

class AlumnoHorario {
  static async crear({ alumno_id, horario_id, fecha_inicio, observacion, turno }) {
    const result = await pool.query(
      `INSERT INTO alumno_horarios (alumno_id, horario_id, fecha_inicio, estado, observacion, turno)
       VALUES ($1, $2, $3, 'activo', $4, $5)
       RETURNING *`,
      [alumno_id, horario_id || null, fecha_inicio || new Date(), observacion || null, turno || null]
    );
    return result.rows[0];
  }

  static async findAll(filtros = {}) {
    let query = `SELECT ah.*, ${HORARIO_LABELS}, h.hora_inicio, h.hora_fin, h.clase, h.grupo,
                 h.turno AS turno_horario, h.dia_semana, h.tipo_actividad,
                 u.nombre AS alumno_nombre, u.correo AS alumno_correo,
                 e.id_usuario AS entrenador_id, e.nombre AS entrenador_nombre
                 FROM alumno_horarios ah
                 LEFT JOIN horarios h ON ah.horario_id = h.id_horario
                 LEFT JOIN usuarios u ON ah.alumno_id = u.id_usuario
                 LEFT JOIN usuarios e ON h.entrenador_id = e.id_usuario`;
    const condiciones = [];
    const params = [];
    let idx = 1;

    if (filtros.alumno_id) {
      condiciones.push(`ah.alumno_id = $${idx++}`);
      params.push(filtros.alumno_id);
    }
    if (filtros.horario_id) {
      condiciones.push(`ah.horario_id = $${idx++}`);
      params.push(filtros.horario_id);
    }
    if (filtros.estado) {
      condiciones.push(`ah.estado = $${idx++}`);
      params.push(filtros.estado);
    }
    if (filtros.entrenador_id) {
      condiciones.push(`h.entrenador_id = $${idx++}`);
      params.push(filtros.entrenador_id);
    }
    if (filtros.turno) {
      condiciones.push(`(ah.turno = $${idx} OR h.turno = $${idx})`);
      params.push(filtros.turno);
      idx++;
    }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }
    query += ' ORDER BY ah.fecha_inicio DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT ah.*, ${HORARIO_LABELS}, h.hora_inicio, h.hora_fin, h.clase, h.grupo, h.cupo_maximo,
       h.turno AS turno_horario, h.dia_semana, h.tipo_actividad,
       u.nombre AS alumno_nombre, u.correo AS alumno_correo,
       e.id_usuario AS entrenador_id, e.nombre AS entrenador_nombre
       FROM alumno_horarios ah
       LEFT JOIN horarios h ON ah.horario_id = h.id_horario
       LEFT JOIN usuarios u ON ah.alumno_id = u.id_usuario
       LEFT JOIN usuarios e ON h.entrenador_id = e.id_usuario
       WHERE ah.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findActivoByAlumno(alumnoId) {
    const result = await pool.query(
      `SELECT ah.*, ${HORARIO_LABELS}, h.hora_inicio, h.hora_fin, h.clase, h.grupo, h.cupo_maximo,
       h.turno AS turno_horario, h.dia_semana, h.tipo_actividad,
       e.id_usuario AS entrenador_id, e.nombre AS entrenador_nombre
       FROM alumno_horarios ah
       LEFT JOIN horarios h ON ah.horario_id = h.id_horario
       LEFT JOIN usuarios e ON h.entrenador_id = e.id_usuario
       WHERE ah.alumno_id = $1 AND ah.estado = 'activo'
       LIMIT 1`,
      [alumnoId]
    );
    return result.rows[0] || null;
  }

  static async findByHorario(horarioId) {
    const result = await pool.query(
      `SELECT ah.*, u.id_usuario, u.nombre AS alumno_nombre, u.correo AS alumno_correo,
       pal.estado_pago, pal.fecha_inscripcion
       FROM alumno_horarios ah
       JOIN usuarios u ON ah.alumno_id = u.id_usuario
       LEFT JOIN perfiles_alumnos pal ON pal.alumno_id = u.id_usuario
       WHERE ah.horario_id = $1 AND ah.estado = 'activo'
       ORDER BY u.nombre`,
      [horarioId]
    );
    return result.rows;
  }

  static async findByHorarioAndAlumno(horarioId, alumnoId) {
    const result = await pool.query(
      `SELECT ah.*, u.id_usuario, u.nombre AS alumno_nombre,
       pal.estado_pago, pal.fecha_inscripcion
       FROM alumno_horarios ah
       JOIN usuarios u ON ah.alumno_id = u.id_usuario
       LEFT JOIN perfiles_alumnos pal ON pal.alumno_id = u.id_usuario
       WHERE ah.horario_id = $1 AND ah.alumno_id = $2
       LIMIT 1`,
      [horarioId, alumnoId]
    );
    return result.rows[0] || null;
  }

  static async findHistorialByAlumno(alumnoId) {
    const result = await pool.query(
      `SELECT ah.*, ${HORARIO_LABELS}, h.hora_inicio, h.hora_fin, h.clase,
       h.turno AS turno_horario, h.tipo_actividad,
       e.nombre AS entrenador_nombre
       FROM alumno_horarios ah
       LEFT JOIN horarios h ON ah.horario_id = h.id_horario
       LEFT JOIN usuarios e ON h.entrenador_id = e.id_usuario
       WHERE ah.alumno_id = $1
       ORDER BY ah.fecha_inicio DESC`,
      [alumnoId]
    );
    return result.rows;
  }

  static async desactivar(id) {
    const result = await pool.query(
      `UPDATE alumno_horarios SET estado = 'inactivo', fecha_fin = CURRENT_DATE, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async contarAlumnosByHorario(horarioId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM alumno_horarios
       WHERE horario_id = $1 AND estado = 'activo'`,
      [horarioId]
    );
    return result.rows[0].count;
  }

  static async findActivosByTurno(turno) {
    const result = await pool.query(
      `SELECT ah.*, u.id_usuario, u.nombre AS alumno_nombre, u.correo AS alumno_correo,
       pal.estado_pago, pal.fecha_inscripcion
       FROM alumno_horarios ah
       JOIN usuarios u ON ah.alumno_id = u.id_usuario
       LEFT JOIN perfiles_alumnos pal ON pal.alumno_id = u.id_usuario
       WHERE (ah.turno = $1 OR ah.horario_id IN (
         SELECT id_horario FROM horarios WHERE turno = $1
       ))
       AND ah.estado = 'activo'
       ORDER BY u.nombre`,
      [turno]
    );
    return result.rows;
  }

  static async desactivarByAlumno(alumnoId) {
    const result = await pool.query(
      `UPDATE alumno_horarios SET estado = 'inactivo', fecha_fin = CURRENT_DATE, updated_at = NOW()
       WHERE alumno_id = $1 AND estado = 'activo' RETURNING *`,
      [alumnoId]
    );
    return result.rows;
  }

  static async desactivarByHorario(horarioId) {
    const result = await pool.query(
      `UPDATE alumno_horarios SET estado = 'inactivo', fecha_fin = CURRENT_DATE, updated_at = NOW()
       WHERE horario_id = $1 AND estado = 'activo' RETURNING *`,
      [horarioId]
    );
    return result.rows;
  }
}

module.exports = AlumnoHorario;
