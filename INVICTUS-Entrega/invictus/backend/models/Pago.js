const pool = require('../config/database');

class Pago {
  static async crear({ alumno_id, mes, anio, monto, estado, fecha_pago, fecha_vencimiento, metodo_pago, observacion, registrado_por }) {
    const result = await pool.query(
      `INSERT INTO pagos (alumno_id, mes, anio, monto, estado, fecha_pago, fecha_vencimiento, metodo_pago, observacion, registrado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (alumno_id, mes, anio)
       DO UPDATE SET
         monto = EXCLUDED.monto,
         estado = EXCLUDED.estado,
         fecha_pago = EXCLUDED.fecha_pago,
         fecha_vencimiento = EXCLUDED.fecha_vencimiento,
         metodo_pago = EXCLUDED.metodo_pago,
         observacion = EXCLUDED.observacion,
         registrado_por = EXCLUDED.registrado_por,
         updated_at = NOW()
       RETURNING *`,
      [alumno_id, mes, anio, monto, estado, fecha_pago, fecha_vencimiento, metodo_pago, observacion, registrado_por]
    );
    return result.rows[0];
  }

  static async findAll({ mes, anio, estado, turno, busqueda } = {}) {
    let query = `
      SELECT
        u.id_usuario AS alumno_id,
        u.nombre AS alumno_nombre,
        u.correo AS alumno_correo,
        pal.estado_pago AS estado_actual,
        pal.fecha_inscripcion,
        pal.fecha_vencimiento AS fecha_vencimiento_actual,
        ah.turno,
        p.id_pago,
        p.mes,
        p.anio,
        p.monto,
        p.estado AS estado_pago,
        p.fecha_pago,
        p.fecha_vencimiento,
        p.metodo_pago,
        p.observacion,
        p.registrado_por,
        p.created_at AS pago_created_at
      FROM usuarios u
      LEFT JOIN perfiles_alumnos pal ON pal.alumno_id = u.id_usuario
      LEFT JOIN pagos p ON u.id_usuario = p.alumno_id AND p.mes = $1 AND p.anio = $2
      LEFT JOIN LATERAL (
        SELECT ah.turno FROM alumno_horarios ah
        WHERE ah.alumno_id = u.id_usuario AND ah.estado = 'activo'
        ORDER BY ah.fecha_inicio DESC
        LIMIT 1
      ) ah ON true
      WHERE u.rol = 'Alumno'
    `;
    const params = [mes, anio];
    let idx = 3;

    if (estado) {
      if (estado === 'pagado') {
        query += ` AND (p.estado = 'pagado' OR (p.id_pago IS NULL AND pal.estado_pago = 'pagado'))`;
      } else if (estado === 'pendiente') {
        query += ` AND (p.estado IS NULL OR p.estado = 'pendiente') AND (pal.estado_pago IS NULL OR pal.estado_pago = 'pendiente')`;
      } else if (estado === 'vencido') {
        query += ` AND (p.estado = 'vencido' OR (p.id_pago IS NULL AND pal.estado_pago = 'vencido'))`;
      }
    }

    if (turno) {
      query += ` AND ah.turno = $${idx++}`;
      params.push(turno);
    }

    if (busqueda && busqueda.trim()) {
      const term = `%${busqueda.trim()}%`;
      query += ` AND (u.nombre ILIKE $${idx} OR u.correo ILIKE $${idx} OR u.ci ILIKE $${idx})`;
      params.push(term);
      idx++;
    }

    query += ` ORDER BY u.nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByAlumno(alumnoId) {
    const result = await pool.query(
      `SELECT p.*, u.nombre AS registrado_por_nombre
       FROM pagos p
       LEFT JOIN usuarios u ON p.registrado_por = u.id_usuario
       WHERE p.alumno_id = $1
       ORDER BY p.anio DESC, p.mes DESC`,
      [alumnoId]
    );
    return result.rows;
  }

  static async getResumen(mes, anio) {
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM usuarios WHERE rol = 'Alumno') AS total_alumnos,
        COALESCE((SELECT COUNT(*)::int FROM pagos WHERE mes = $1 AND anio = $2 AND estado = 'pagado'), 0) AS pagados_mes,
        COALESCE((SELECT COUNT(*)::int FROM pagos WHERE mes = $1 AND anio = $2 AND estado = 'vencido'), 0) AS vencidos,
        COALESCE((SELECT SUM(monto)::float FROM pagos WHERE mes = $1 AND anio = $2 AND estado = 'pagado'), 0) AS ingresos_mes,
        (SELECT COUNT(*)::int FROM perfiles_alumnos WHERE fecha_inscripcion = CURRENT_DATE) AS inscritos_hoy,
        (SELECT COUNT(*)::int FROM perfiles_alumnos WHERE fecha_inscripcion >= date_trunc('week', CURRENT_DATE) AND fecha_inscripcion <= CURRENT_DATE) AS inscritos_semana,
        (SELECT COUNT(*)::int FROM perfiles_alumnos WHERE EXTRACT(YEAR FROM fecha_inscripcion) = $2 AND EXTRACT(MONTH FROM fecha_inscripcion) = $1) AS inscritos_mes`,
      [mes, anio]
    );

    const row = result.rows[0];
    const totalAlumnos = row.total_alumnos;
    const pagadosMes = row.pagados_mes;
    const vencidos = row.vencidos;
    const pendientesMes = totalAlumnos - pagadosMes - vencidos;

    return {
      total_alumnos: totalAlumnos,
      pagados_mes: pagadosMes,
      pendientes_mes: pendientesMes < 0 ? 0 : pendientesMes,
      vencidos: vencidos,
      ingresos_mes: row.ingresos_mes,
      inscritos_hoy: row.inscritos_hoy,
      inscritos_semana: row.inscritos_semana,
      inscritos_mes: row.inscritos_mes,
    };
  }

  static async countAlumnosSinPago(mes, anio) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM usuarios u
       WHERE u.rol = 'Alumno'
       AND NOT EXISTS (
         SELECT 1 FROM pagos p WHERE p.alumno_id = u.id_usuario AND p.mes = $1 AND p.anio = $2
       )`,
      [mes, anio]
    );
    return result.rows[0].count;
  }
}

module.exports = Pago;
