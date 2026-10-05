const pool = require('../config/database');

class Alumno {
  static async findById(idAlumno) {
    const result = await pool.query(
      `SELECT al.*, u.id_usuario, u.nombre, u.correo, u.estado
       FROM alumnos al
       JOIN usuarios u ON u.id_usuario = al.usuario_id
       WHERE al.id_alumno = $1`,
      [idAlumno]
    );
    return result.rows[0] || null;
  }

  static async findByUsuarioId(usuarioId) {
    const result = await pool.query(
      `SELECT al.*, u.id_usuario, u.nombre, u.correo, u.estado
       FROM alumnos al
       JOIN usuarios u ON u.id_usuario = al.usuario_id
       WHERE al.usuario_id = $1`,
      [usuarioId]
    );
    return result.rows[0] || null;
  }

  static async updatePago(idAlumno, { estado_pago, fecha_inscripcion, fecha_vencimiento }) {
    const fields = [];
    const params = [];
    let idx = 1;
    if (estado_pago !== undefined) {
      fields.push(`estado_pago = $${idx++}`);
      params.push(estado_pago);
    }
    if (fecha_inscripcion !== undefined) {
      fields.push(`fecha_inscripcion = $${idx++}`);
      params.push(fecha_inscripcion);
    }
    if (fecha_vencimiento !== undefined) {
      fields.push(`fecha_vencimiento = $${idx++}`);
      params.push(fecha_vencimiento);
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = NOW()');
    params.push(idAlumno);
    const result = await pool.query(
      `UPDATE alumnos SET ${fields.join(', ')} WHERE id_alumno = $${idx} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  }
}

module.exports = Alumno;