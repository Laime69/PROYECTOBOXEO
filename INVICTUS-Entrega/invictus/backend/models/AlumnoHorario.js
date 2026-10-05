const pool = require('../config/database');

const HORARIO_LABELS = `
  CASE h.nombre_turno WHEN 'manana' THEN 'Mañana' WHEN 'tarde' THEN 'Tarde' WHEN 'noche' THEN 'Noche' END AS nombre_turno,
  CASE LOWER(h.dia_semana) WHEN 'miercoles' THEN 'Miércoles' ELSE INITCAP(h.dia_semana) END AS dia,
  'Lunes a Viernes' AS dias`;

const AH_JOIN = `
  FROM alumno_horarios ah
  LEFT JOIN horarios h ON ah.horario_id = h.id_horario
  LEFT JOIN alumnos al ON al.id_alumno = ah.alumno_id
  LEFT JOIN usuarios u ON u.id_usuario = al.usuario_id
  LEFT JOIN entrenadores etr ON etr.id_entrenador = h.entrenador_id
  LEFT JOIN usuarios e ON e.id_usuario = etr.usuario_id`;

class AlumnoHorario {
  static async crear({ alumno_id, horario_id, fecha_inicio, observacion }) {
    const result = await pool.query(
      `INSERT INTO alumno_horarios (alumno_id, horario_id, fecha_inicio, estado, observacion)
       VALUES ($1, $2, $3, 'activo', $4)
       RETURNING *`,
      [alumno_id, horario_id || null, fecha_inicio || new Date(), observacion || null]
    );
    return result.rows[0];
  }

  static async findAll(filtros = {}) {
    let query = `SELECT ah.*, ${HORARIO_LABELS}, h.hora_inicio, h.hora_fin, h.clase, h.grupo,
                 h.nombre_turno AS turno_horario, h.dia_semana, h.tipo_actividad,
                 u.id_usuario, u.nombre AS alumno_nombre, u.correo AS alumno_correo,
                 etr.id_entrenador AS entrenador_id, e.nombre AS entrenador_nombre
                 ${AH_JOIN}`;
    const condiciones = [];
    const params = [];
    let idx = 1;

    if (filtros.alumno_id) {
      condiciones.push(`ah.alumno_id = $${idx++}`);
      params.push(parseInt(filtros.alumno_id, 10));
    }
    if (filtros.horario_id) {
      condiciones.push(`ah.horario_id = $${idx++}`);
      params.push(parseInt(filtros.horario_id, 10));
    }
    if (filtros.estado) {
      condiciones.push(`ah.estado = $${idx++}`);
      params.push(filtros.estado);
    }
    if (filtros.entrenador_id) {
      condiciones.push(`h.entrenador_id = $${idx++}`);
      params.push(parseInt(filtros.entrenador_id, 10));
    }
    if (filtros.turno) {
      condiciones.push(`h.nombre_turno = $${idx++}`);
      params.push(filtros.turno);
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
       h.nombre_turno AS turno_horario, h.dia_semana, h.tipo_actividad,
       u.id_usuario, u.nombre AS alumno_nombre, u.correo AS alumno_correo,
       etr.id_entrenador AS entrenador_id, e.nombre AS entrenador_nombre
       ${AH_JOIN}
       WHERE ah.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  // Un alumno puede tener varios horarios activos. Este método devuelve
  // el más reciente para no romper los llamadores que esperan uno solo;
  // el orden es explícito para que sea determinista.
  static async findActivoByAlumno(alumnoId) {
    const result = await pool.query(
      `SELECT ah.*, ${HORARIO_LABELS}, h.hora_inicio, h.hora_fin, h.clase, h.grupo, h.cupo_maximo,
       h.nombre_turno AS turno_horario, h.dia_semana, h.tipo_actividad,
       etr.id_entrenador AS entrenador_id, e.nombre AS entrenador_nombre
       ${AH_JOIN}
       WHERE ah.alumno_id = $1 AND ah.estado = 'activo'
       ORDER BY ah.fecha_inicio DESC, ah.id DESC
       LIMIT 1`,
      [alumnoId]
    );
    return result.rows[0] || null;
  }

  static async findActivosByAlumno(alumnoId) {
    const result = await pool.query(
      `SELECT ah.*, ${HORARIO_LABELS}, h.hora_inicio, h.hora_fin, h.clase, h.grupo, h.cupo_maximo,
       h.nombre_turno AS turno_horario, h.dia_semana, h.tipo_actividad,
       etr.id_entrenador AS entrenador_id, e.nombre AS entrenador_nombre
       ${AH_JOIN}
       WHERE ah.alumno_id = $1 AND ah.estado = 'activo'
       ORDER BY h.dia_semana,
         CASE h.nombre_turno WHEN 'manana' THEN 1 WHEN 'tarde' THEN 2 WHEN 'noche' THEN 3 END`,
      [alumnoId]
    );
    return result.rows;
  }

  // Desactiva solo la asignación de un bloque concreto, dejando intactas
  // las demás del alumno (un alumno puede estar en varios bloques).
  static async desactivarPorHorarioYAlumno(horarioId, alumnoId) {
    const result = await pool.query(
      `UPDATE alumno_horarios SET estado = 'inactivo', fecha_fin = CURRENT_DATE, updated_at = NOW()
       WHERE horario_id = $1 AND alumno_id = $2 AND estado = 'activo' RETURNING *`,
      [horarioId, alumnoId]
    );
    return result.rows[0] || null;
  }

  static async findByHorario(horarioId) {
    const result = await pool.query(
      `SELECT ah.*, u.id_usuario, al.id_alumno, u.nombre AS alumno_nombre, u.correo AS alumno_correo,
       al.estado_pago, al.fecha_inscripcion
       ${AH_JOIN}
       WHERE ah.horario_id = $1 AND ah.estado = 'activo'
       ORDER BY u.nombre`,
      [horarioId]
    );
    return result.rows;
  }

  static async findByHorarioAndAlumno(horarioId, alumnoId) {
    const result = await pool.query(
      `SELECT ah.*, u.id_usuario, al.id_alumno, u.nombre AS alumno_nombre,
       al.estado_pago, al.fecha_inscripcion
       ${AH_JOIN}
       WHERE ah.horario_id = $1 AND ah.alumno_id = $2
       LIMIT 1`,
      [horarioId, alumnoId]
    );
    return result.rows[0] || null;
  }

  static async findHistorialByAlumno(alumnoId) {
    const result = await pool.query(
      `SELECT ah.*, ${HORARIO_LABELS}, h.hora_inicio, h.hora_fin, h.clase,
       h.nombre_turno AS turno_horario, h.tipo_actividad,
       e.nombre AS entrenador_nombre
       ${AH_JOIN}
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
      `SELECT ah.*, u.id_usuario, al.id_alumno, u.nombre AS alumno_nombre, u.correo AS alumno_correo,
       al.estado_pago, al.fecha_inscripcion
       ${AH_JOIN}
       WHERE h.nombre_turno = $1 AND ah.estado = 'activo'
       ORDER BY u.nombre`,
      [quitarAcentos(turno)]
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

function quitarAcentos(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

module.exports = AlumnoHorario;