const pool = require('../config/database');

class Membresia {
  static async findByAlumno(alumnoId) {
    const result = await pool.query(
      `SELECT m.*, al.usuario_id, u.nombre AS alumno_nombre, u.correo AS alumno_correo
       FROM membresias m
       JOIN alumnos al ON al.id_alumno = m.alumno_id
       JOIN usuarios u ON u.id_usuario = al.usuario_id
       WHERE m.alumno_id = $1
       ORDER BY m.created_at DESC
       LIMIT 1`,
      [alumnoId]
    );
    return result.rows[0] || null;
  }

  static async findAll() {
    const result = await pool.query(
      `SELECT m.*, al.id_alumno, u.id_usuario, u.nombre AS alumno_nombre, u.correo AS alumno_correo
       FROM membresias m
       JOIN alumnos al ON al.id_alumno = m.alumno_id
       JOIN usuarios u ON u.id_usuario = al.usuario_id
       ORDER BY u.nombre ASC`
    );
    return result.rows;
  }

  static async crear({ alumno_id, tipo_plan, fecha_inicio, fecha_vencimiento, monto, estado }) {
    const result = await pool.query(
      `INSERT INTO membresias (alumno_id, tipo_plan, fecha_inicio, fecha_vencimiento, monto, estado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [alumno_id, tipo_plan || 'mensual', fecha_inicio || new Date(), fecha_vencimiento || null, monto || 200.0, estado || 'activa']
    );
    return result.rows[0];
  }

  static async update(idMembresia, data) {
    const fields = [];
    const params = [];
    let idx = 1;
    const orden = ['tipo_plan', 'fecha_inicio', 'fecha_vencimiento', 'monto', 'estado'];
    for (const c of orden) {
      if (data[c] !== undefined) {
        fields.push(`${c} = $${idx++}`);
        params.push(data[c]);
      }
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = NOW()');
    params.push(idMembresia);
    const result = await pool.query(
      `UPDATE membresias SET ${fields.join(', ')} WHERE id_membresia = $${idx} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  }
}

module.exports = Membresia;