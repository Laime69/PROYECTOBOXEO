const pool = require('../config/database');

const quitarAcentos = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Columnas derivadas (antes almacenadas de forma redundante).
const HORARIO_LABELS = `
  CASE h.turno WHEN 'manana' THEN 'Mañana' WHEN 'tarde' THEN 'Tarde' WHEN 'noche' THEN 'Noche' END AS nombre_turno,
  CASE LOWER(h.dia_semana) WHEN 'miercoles' THEN 'Miércoles' ELSE INITCAP(h.dia_semana) END AS dia,
  'Lunes a Viernes' AS dias`;

class Horario {
  static async crear({ entrenador_id, dia_semana, turno, hora_inicio, hora_fin, clase, grupo, estado, cupo_maximo, tipo_actividad, dia, nombre_turno }) {
    const result = await pool.query(
      `INSERT INTO horarios (entrenador_id, dia_semana, turno, hora_inicio, hora_fin, clase, grupo, estado, cupo_maximo, tipo_actividad)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        entrenador_id || null,
        dia_semana || (dia ? quitarAcentos(dia) : null),
        turno || (nombre_turno ? quitarAcentos(nombre_turno) : null),
        hora_inicio,
        hora_fin,
        clase || 'Boxeo',
        grupo || null,
        estado || 'activo',
        cupo_maximo || null,
        tipo_actividad || 'entrenamiento',
      ]
    );
    return result.rows[0];
  }

  static async findAll(filtros = {}) {
    let query = `SELECT h.*, ${HORARIO_LABELS}, u.nombre AS entrenador_nombre, u.correo AS entrenador_correo
                 FROM horarios h
                 LEFT JOIN usuarios u ON h.entrenador_id = u.id_usuario`;
    const condiciones = [];
    const params = [];
    let idx = 1;

    if (filtros.dia) {
      condiciones.push(`h.dia_semana = $${idx++}`);
      params.push(quitarAcentos(filtros.dia));
    }
    if (filtros.dia_semana) {
      condiciones.push(`h.dia_semana = $${idx++}`);
      params.push(filtros.dia_semana);
    }
    if (filtros.turno) {
      condiciones.push(`h.turno = $${idx++}`);
      params.push(filtros.turno);
    }
    if (filtros.nombre_turno) {
      condiciones.push(`h.turno = $${idx++}`);
      params.push(quitarAcentos(filtros.nombre_turno));
    }
    if (filtros.entrenador_id) {
      condiciones.push(`h.entrenador_id = $${idx++}`);
      params.push(filtros.entrenador_id);
    }
    if (filtros.estado) {
      condiciones.push(`h.estado = $${idx++}`);
      params.push(filtros.estado);
    }
    if (filtros.tipo_actividad) {
      condiciones.push(`h.tipo_actividad = $${idx++}`);
      params.push(filtros.tipo_actividad);
    }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }
    query += ' ORDER BY h.turno, h.dia_semana, h.hora_inicio';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT h.*, ${HORARIO_LABELS}, u.nombre AS entrenador_nombre, u.correo AS entrenador_correo
       FROM horarios h
       LEFT JOIN usuarios u ON h.entrenador_id = u.id_usuario
       WHERE h.id_horario = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    let idx = 1;

    if (data.entrenador_id !== undefined) {
      fields.push(`entrenador_id = $${idx++}`);
      params.push(data.entrenador_id);
    }
    if (data.dia_semana !== undefined) {
      fields.push(`dia_semana = $${idx++}`);
      params.push(data.dia_semana);
    } else if (data.dia !== undefined) {
      fields.push(`dia_semana = $${idx++}`);
      params.push(quitarAcentos(data.dia));
    }
    if (data.turno !== undefined) {
      fields.push(`turno = $${idx++}`);
      params.push(data.turno);
    } else if (data.nombre_turno !== undefined) {
      fields.push(`turno = $${idx++}`);
      params.push(quitarAcentos(data.nombre_turno));
    }
    if (data.hora_inicio !== undefined) {
      fields.push(`hora_inicio = $${idx++}`);
      params.push(data.hora_inicio);
    }
    if (data.hora_fin !== undefined) {
      fields.push(`hora_fin = $${idx++}`);
      params.push(data.hora_fin);
    }
    if (data.clase !== undefined) {
      fields.push(`clase = $${idx++}`);
      params.push(data.clase);
    }
    if (data.grupo !== undefined) {
      fields.push(`grupo = $${idx++}`);
      params.push(data.grupo);
    }
    if (data.estado !== undefined) {
      fields.push(`estado = $${idx++}`);
      params.push(data.estado);
    }
    if (data.cupo_maximo !== undefined) {
      fields.push(`cupo_maximo = $${idx++}`);
      params.push(data.cupo_maximo);
    }
    if (data.tipo_actividad !== undefined) {
      fields.push(`tipo_actividad = $${idx++}`);
      params.push(data.tipo_actividad);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);

    params.push(id);
    const result = await pool.query(
      `UPDATE horarios SET ${fields.join(', ')} WHERE id_horario = $${idx} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  }

  static async deleteById(id) {
    const result = await pool.query(
      'DELETE FROM horarios WHERE id_horario = $1 RETURNING id_horario',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByDia(dia) {
    const result = await pool.query(
      `SELECT h.turno, h.hora_inicio, h.hora_fin, h.tipo_actividad, ${HORARIO_LABELS},
              h.clase, h.estado,
              u.nombre AS entrenador_nombre
       FROM horarios h
       LEFT JOIN usuarios u ON h.entrenador_id = u.id_usuario
       WHERE LOWER(h.dia_semana) = LOWER($1)
       ORDER BY CASE h.turno WHEN 'manana' THEN 1 WHEN 'tarde' THEN 2 WHEN 'noche' THEN 3 END`,
      [quitarAcentos(dia)]
    );
    return result.rows;
  }

  static async countAllHorarios() {
    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = 'activo')::int AS activos
       FROM horarios`
    );
    return result.rows[0];
  }

  static async countAll() {
    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = 'activo')::int AS activos,
        COUNT(*) FILTER (WHERE estado = 'inactivo')::int AS inactivos
      FROM horarios`
    );
    return result.rows[0];
  }

  static async findGrilla() {
    const result = await pool.query(
      `SELECT h.*, ${HORARIO_LABELS}, u.nombre AS entrenador_nombre, u.correo AS entrenador_correo,
        COALESCE(ah_count.total, 0) AS total_alumnos
       FROM horarios h
       LEFT JOIN usuarios u ON h.entrenador_id = u.id_usuario
       LEFT JOIN (
         SELECT turno, COUNT(*)::int AS total
         FROM alumno_horarios WHERE estado = 'activo' AND turno IS NOT NULL
         GROUP BY turno
       ) ah_count ON ah_count.turno = h.turno
       ORDER BY
         CASE h.turno
           WHEN 'manana' THEN 1
           WHEN 'tarde' THEN 2
           WHEN 'noche' THEN 3
         END,
         CASE h.dia_semana
           WHEN 'lunes' THEN 1
           WHEN 'martes' THEN 2
           WHEN 'miercoles' THEN 3
           WHEN 'jueves' THEN 4
           WHEN 'viernes' THEN 5
         END`
    );
    return result.rows;
  }

  static async findByTurno(turno) {
    const result = await pool.query(
      `SELECT h.*, ${HORARIO_LABELS}, u.nombre AS entrenador_nombre, u.correo AS entrenador_correo
       FROM horarios h
       LEFT JOIN usuarios u ON h.entrenador_id = u.id_usuario
       WHERE h.turno = $1 AND h.estado = 'activo'
       ORDER BY
         CASE h.dia_semana
           WHEN 'lunes' THEN 1
           WHEN 'martes' THEN 2
           WHEN 'miercoles' THEN 3
           WHEN 'jueves' THEN 4
           WHEN 'viernes' THEN 5
         END`,
      [turno]
    );
    return result.rows;
  }

  static async findByEntrenador(entrenadorId) {
    const result = await pool.query(
      `SELECT h.*, ${HORARIO_LABELS}, u.nombre AS entrenador_nombre, u.correo AS entrenador_correo
       FROM horarios h
       LEFT JOIN usuarios u ON h.entrenador_id = u.id_usuario
       WHERE h.entrenador_id = $1
       ORDER BY h.turno, h.dia_semana, h.hora_inicio`,
      [entrenadorId]
    );
    return result.rows;
  }
}

module.exports = Horario;
