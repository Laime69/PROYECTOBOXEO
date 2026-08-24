const pool = require('../config/database');

class Asistencia {
  static async crear({ alumno_id, entrenador_id, horario_id, fecha, estado, observacion, tipo_actividad }) {
    const result = await pool.query(
      `INSERT INTO asistencias (alumno_id, entrenador_id, horario_id, fecha, estado, observacion, tipo_actividad)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [alumno_id, entrenador_id || null, horario_id || null, fecha, estado, observacion || null, tipo_actividad || null]
    );
    return result.rows[0];
  }

  static async findAll(filtros = {}) {
    let query = `SELECT a.*, u.nombre AS alumno_nombre, u.correo AS alumno_correo,
                 e.nombre AS entrenador_nombre
                 FROM asistencias a
                 LEFT JOIN usuarios u ON a.alumno_id = u.id_usuario
                 LEFT JOIN usuarios e ON a.entrenador_id = e.id_usuario`;
    const condiciones = [];
    const params = [];
    let idx = 1;

    if (filtros.fecha_inicio && filtros.fecha_fin) {
      condiciones.push(`a.fecha >= $${idx++} AND a.fecha <= $${idx++}`);
      params.push(filtros.fecha_inicio, filtros.fecha_fin);
    } else if (filtros.fecha) {
      condiciones.push(`a.fecha = $${idx++}`);
      params.push(filtros.fecha);
    }
    if (filtros.alumno_id) {
      condiciones.push(`a.alumno_id = $${idx++}`);
      params.push(filtros.alumno_id);
    }
    if (filtros.entrenador_id) {
      condiciones.push(`a.entrenador_id = $${idx++}`);
      params.push(filtros.entrenador_id);
    }
    if (filtros.estado) {
      condiciones.push(`a.estado = $${idx++}`);
      params.push(filtros.estado);
    }
    if (filtros.tipo_actividad) {
      condiciones.push(`a.tipo_actividad = $${idx++}`);
      params.push(filtros.tipo_actividad);
    }
    if (filtros.horario_id) {
      condiciones.push(`a.horario_id = $${idx++}`);
      params.push(filtros.horario_id);
    }
    if (filtros.busqueda && filtros.busqueda.trim()) {
      const term = `%${filtros.busqueda.trim()}%`;
      condiciones.push(`(u.nombre ILIKE $${idx} OR u.correo ILIKE $${idx} OR e.nombre ILIKE $${idx})`);
      params.push(term);
      idx++;
    }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }
    query += ' ORDER BY a.fecha DESC, a.id_asistencia DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT a.*, u.nombre AS alumno_nombre, u.correo AS alumno_correo,
       e.nombre AS entrenador_nombre
       FROM asistencias a
       LEFT JOIN usuarios u ON a.alumno_id = u.id_usuario
       LEFT JOIN usuarios e ON a.entrenador_id = e.id_usuario
       WHERE a.id_asistencia = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    let idx = 1;

    if (data.alumno_id !== undefined) {
      fields.push(`alumno_id = $${idx++}`);
      params.push(data.alumno_id);
    }
    if (data.entrenador_id !== undefined) {
      fields.push(`entrenador_id = $${idx++}`);
      params.push(data.entrenador_id);
    }
    if (data.horario_id !== undefined) {
      fields.push(`horario_id = $${idx++}`);
      params.push(data.horario_id);
    }
    if (data.fecha !== undefined) {
      fields.push(`fecha = $${idx++}`);
      params.push(data.fecha);
    }
    if (data.estado !== undefined) {
      fields.push(`estado = $${idx++}`);
      params.push(data.estado);
    }
    if (data.observacion !== undefined) {
      fields.push(`observacion = $${idx++}`);
      params.push(data.observacion);
    }
    if (data.tipo_actividad !== undefined) {
      fields.push(`tipo_actividad = $${idx++}`);
      params.push(data.tipo_actividad);
    }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) return null;

    params.push(id);
    const result = await pool.query(
      `UPDATE asistencias SET ${fields.join(', ')} WHERE id_asistencia = $${idx} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  }

  static async deleteById(id) {
    const result = await pool.query(
      'DELETE FROM asistencias WHERE id_asistencia = $1 RETURNING id_asistencia',
      [id]
    );
    return result.rows[0] || null;
  }

  static async countAll() {
    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = 'presente')::int AS presentes,
        COUNT(*) FILTER (WHERE estado = 'falta')::int AS faltas,
        COUNT(*) FILTER (WHERE estado = 'permiso')::int AS permisos,
        COUNT(*) FILTER (WHERE estado = 'tardanza')::int AS tardanzas,
        COUNT(*) FILTER (WHERE estado = 'justificado')::int AS justificados
      FROM asistencias`
    );
    return result.rows[0];
  }

  static async countAllByEntrenador(entrenadorId, fechaInicio = null, fechaFin = null) {
    let query = `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE estado = 'presente')::int AS presentes,
      COUNT(*) FILTER (WHERE estado = 'falta')::int AS faltas,
      COUNT(*) FILTER (WHERE estado = 'permiso')::int AS permisos,
      COUNT(*) FILTER (WHERE estado = 'tardanza')::int AS tardanzas,
      COUNT(*) FILTER (WHERE estado = 'justificado')::int AS justificados
    FROM asistencias WHERE entrenador_id = $1`;
    const params = [entrenadorId];
    if (fechaInicio && fechaFin) {
      query += ` AND fecha >= $2 AND fecha <= $3`;
      params.push(fechaInicio, fechaFin);
    }
    const result = await pool.query(query, params);
    return result.rows[0];
  }

  static async countByFecha(fechaInicio, fechaFin) {
    const result = await pool.query(
      `SELECT fecha, COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = 'presente')::int AS presentes
       FROM asistencias
       WHERE fecha >= $1 AND fecha <= $2
       GROUP BY fecha
       ORDER BY fecha`,
      [fechaInicio, fechaFin]
    );
    return result.rows;
  }
}

module.exports = Asistencia;
