const pool = require('../config/database');

const ROL_ALUMNO = `(SELECT id_rol FROM roles WHERE nombre = 'Alumno')`;

class Pago {
  static async _resolverMembresia(alumnoId) {
    const result = await pool.query(
      `SELECT m.id_membresia
       FROM alumnos al
       JOIN membresias m ON m.alumno_id = al.id_alumno
       WHERE al.id_alumno = $1
       ORDER BY m.created_at DESC, m.id_membresia DESC
       LIMIT 1`,
      [alumnoId]
    );
    return result.rows[0] || null;
  }

  static async existeAlumno(alumnoId) {
    const result = await pool.query(
      `SELECT al.id_alumno
       FROM alumnos al
       JOIN usuarios u ON u.id_usuario = al.usuario_id
       WHERE al.id_alumno = $1 AND u.rol_id = ${ROL_ALUMNO}`,
      [alumnoId]
    );
    return !!(result.rows[0]);
  }

  static async crear({ alumno_id, mes, anio, monto, estado, fecha_pago, fecha_vencimiento, metodo_pago, observacion, registrado_por }) {
    const mem = await Pago._resolverMembresia(alumno_id);
    if (!mem) {
      throw new Error('El alumno no tiene una membresía asignada');
    }
    const result = await pool.query(
      `INSERT INTO pagos (membresia_id, mes, anio, monto, estado, fecha_pago, fecha_vencimiento, metodo_pago, observacion, registrado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (membresia_id, mes, anio)
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
      [mem.id_membresia, mes, anio, monto, estado, fecha_pago, fecha_vencimiento, metodo_pago || null, observacion || null, registrado_por || null]
    );
    return result.rows[0];
  }

  static async upsertDesdePerfil({ alumno_id, mes, anio, monto, estado, fecha_pago, fecha_vencimiento }) {
    const mem = await Pago._resolverMembresia(alumno_id);
    if (!mem) return null;
    const result = await pool.query(
      `INSERT INTO pagos (membresia_id, mes, anio, monto, estado, fecha_pago, fecha_vencimiento, metodo_pago, observacion, registrado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, NULL)
       ON CONFLICT (membresia_id, mes, anio)
       DO UPDATE SET
         monto = EXCLUDED.monto,
         estado = EXCLUDED.estado,
         fecha_pago = EXCLUDED.fecha_pago,
         fecha_vencimiento = EXCLUDED.fecha_vencimiento,
         updated_at = NOW()
       RETURNING *`,
      [mem.id_membresia, mes, anio, monto, estado, fecha_pago, fecha_vencimiento]
    );
    return result.rows[0];
  }

  static async findAll({ mes, anio, estado, turno, busqueda } = {}) {
    let query = `
      SELECT
        al.id_alumno AS alumno_id,
        u.id_usuario,
        u.nombre AS alumno_nombre,
        u.correo AS alumno_correo,
        al.estado_pago AS estado_actual,
        al.fecha_inscripcion,
        al.fecha_vencimiento AS fecha_vencimiento_actual,
        h.turno,
        m.id_membresia,
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
      JOIN alumnos al ON al.usuario_id = u.id_usuario
      LEFT JOIN membresias m ON m.alumno_id = al.id_alumno
      LEFT JOIN pagos p ON p.membresia_id = m.id_membresia AND p.mes = $1 AND p.anio = $2
      LEFT JOIN LATERAL (
        SELECT h.nombre_turno AS turno
        FROM alumno_horarios ah
        JOIN horarios h ON h.id_horario = ah.horario_id
        WHERE ah.alumno_id = al.id_alumno AND ah.estado = 'activo'
        ORDER BY ah.fecha_inicio DESC
        LIMIT 1
      ) h ON true
      WHERE u.rol_id = ${ROL_ALUMNO}
    `;
    const params = [mes, anio];
    let idx = 3;

    if (estado) {
      if (estado === 'pagado') {
        query += ` AND (p.estado = 'pagado' OR (p.id_pago IS NULL AND al.estado_pago = 'pagado'))`;
      } else if (estado === 'pendiente') {
        query += ` AND (p.estado IS NULL OR p.estado = 'pendiente') AND (al.estado_pago IS NULL OR al.estado_pago = 'pendiente')`;
      } else if (estado === 'vencido') {
        query += ` AND (p.estado = 'vencido' OR (p.id_pago IS NULL AND al.estado_pago = 'vencido'))`;
      }
    }

    if (turno) {
      query += ` AND h.turno = $${idx++}`;
      params.push(turno);
    }

    if (busqueda && busqueda.trim()) {
      const term = `%${busqueda.trim()}%`;
      query += ` AND (u.nombre ILIKE $${idx} OR u.correo ILIKE $${idx} OR al.ci ILIKE $${idx})`;
      params.push(term);
      idx++;
    }

    query += ` ORDER BY u.nombre ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByAlumno(alumnoId) {
    const result = await pool.query(
      `SELECT m.alumno_id AS alumno_id, p.id_pago, p.membresia_id, p.mes, p.anio, p.monto, p.estado,
              p.fecha_pago, p.fecha_vencimiento, p.metodo_pago, p.observacion,
              p.registrado_por, p.created_at AS pago_created_at,
              u.nombre AS registrado_por_nombre
       FROM pagos p
       JOIN membresias m ON m.id_membresia = p.membresia_id
       LEFT JOIN usuarios u ON p.registrado_por = u.id_usuario
       WHERE m.alumno_id = $1
       ORDER BY p.anio DESC, p.mes DESC`,
      [alumnoId]
    );
    return result.rows;
  }

  static async findById(idPago) {
    const result = await pool.query(
      `SELECT p.*, al.id_alumno AS alumno_id, u.nombre AS alumno_nombre, r.nombre AS alumno_rol
       FROM pagos p
       JOIN membresias m ON m.id_membresia = p.membresia_id
       JOIN alumnos al ON al.id_alumno = m.alumno_id
       JOIN usuarios u ON u.id_usuario = al.usuario_id
       LEFT JOIN roles r ON r.id_rol = u.rol_id
       WHERE p.id_pago = $1`,
      [idPago]
    );
    return result.rows[0] || null;
  }

  static async updateById(idPago, data) {
    const campos = {
      monto: data.monto !== undefined,
      estado: data.estado !== undefined,
      fecha_pago: data.fecha_pago !== undefined,
      fecha_vencimiento: data.fecha_vencimiento !== undefined,
      metodo_pago: data.metodo_pago !== undefined,
      observacion: data.observacion !== undefined,
    };
    const sets = [];
    const params = [];
    let idx = 1;
    const orden = ['monto', 'estado', 'fecha_pago', 'fecha_vencimiento', 'metodo_pago', 'observacion'];
    for (const c of orden) {
      if (campos[c]) {
        sets.push(`${c} = $${idx++}`);
        params.push(data[c]);
      }
    }
    if (sets.length === 0) return null;
    params.push(idPago);
    const result = await pool.query(
      `UPDATE pagos SET ${sets.join(', ')}, updated_at = NOW() WHERE id_pago = $${idx} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  }

  static async getResumen(mes, anio) {
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM alumnos) AS total_alumnos,
        COALESCE((SELECT COUNT(*)::int FROM pagos p JOIN membresias m ON m.id_membresia = p.membresia_id
                  WHERE p.mes = $1 AND p.anio = $2 AND p.estado = 'pagado'), 0) AS pagados_mes,
        COALESCE((SELECT COUNT(*)::int FROM pagos p JOIN membresias m ON m.id_membresia = p.membresia_id
                  WHERE p.mes = $1 AND p.anio = $2), 0) AS registros_mes,
        COALESCE((SELECT COUNT(*)::int FROM pagos p JOIN membresias m ON m.id_membresia = p.membresia_id
                  WHERE p.mes = $1 AND p.anio = $2 AND p.estado = 'vencido'), 0) AS vencidos,
        COALESCE((SELECT SUM(p.monto)::float FROM pagos p JOIN membresias m ON m.id_membresia = p.membresia_id
                  WHERE p.mes = $1 AND p.anio = $2 AND p.estado = 'pagado'), 0) AS ingresos_mes,
        (SELECT COUNT(*)::int FROM alumnos WHERE fecha_inscripcion = CURRENT_DATE) AS inscritos_hoy,
        (SELECT COUNT(*)::int FROM alumnos WHERE fecha_inscripcion >= date_trunc('week', CURRENT_DATE) AND fecha_inscripcion <= CURRENT_DATE) AS inscritos_semana,
        (SELECT COUNT(*)::int FROM alumnos WHERE EXTRACT(YEAR FROM fecha_inscripcion) = $2 AND EXTRACT(MONTH FROM fecha_inscripcion) = $1) AS inscritos_mes`,
      [mes, anio]
    );

    const row = result.rows[0];
    const totalAlumnos = row.total_alumnos;
    const pagadosMes = row.pagados_mes;
    const vencidos = row.vencidos;
    const pendientesMes = totalAlumnos - pagadosMes - vencidos;

    return {
      total_alumnos: totalAlumnos,
      registros_mes: row.registros_mes,
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
      `SELECT COUNT(*)::int AS count
       FROM alumnos al
       WHERE NOT EXISTS (
         SELECT 1 FROM pagos p
         JOIN membresias m ON m.id_membresia = p.membresia_id
         WHERE m.alumno_id = al.id_alumno AND p.mes = $1 AND p.anio = $2
       )`,
      [mes, anio]
    );
    return result.rows[0].count;
  }
}

module.exports = Pago;