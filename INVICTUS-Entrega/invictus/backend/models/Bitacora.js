const pool = require('../config/database');

class Bitacora {
  static async registrar({ usuario_id, rol, accion, modulo, descripcion, ip }) {
    const result = await pool.query(
      `INSERT INTO bitacora_acciones (usuario_id, rol_id, accion, modulo, descripcion, ip)
       VALUES ($1, (SELECT id_rol FROM roles WHERE nombre = $2), $3, $4, $5, $6)
       RETURNING *`,
      [usuario_id || null, rol || null, accion, modulo, descripcion || null, ip || null]
    );
    return result.rows[0];
  }

  static async findAll(filtros = {}) {
    let query = `SELECT b.*, r.nombre AS rol, u.nombre AS usuario_nombre, u.correo AS usuario_correo
                 FROM bitacora_acciones b
                 LEFT JOIN usuarios u ON b.usuario_id = u.id_usuario
                 LEFT JOIN roles r ON r.id_rol = b.rol_id`;
    const condiciones = [];
    const params = [];
    let idx = 1;

    if (filtros.usuario_id) {
      condiciones.push(`b.usuario_id = $${idx++}`);
      params.push(filtros.usuario_id);
    }
    if (filtros.rol) {
      condiciones.push(`r.nombre = $${idx++}`);
      params.push(filtros.rol);
    }
    if (filtros.modulo) {
      condiciones.push(`b.modulo = $${idx++}`);
      params.push(filtros.modulo);
    }
    if (filtros.accion) {
      condiciones.push(`b.accion = $${idx++}`);
      params.push(filtros.accion);
    }
    if (filtros.fecha_desde) {
      condiciones.push(`b.fecha_hora >= $${idx++}`);
      params.push(filtros.fecha_desde);
    }
    if (filtros.fecha_hasta) {
      condiciones.push(`b.fecha_hora <= $${idx++}`);
      params.push(filtros.fecha_hasta);
    }
    if (filtros.busqueda && filtros.busqueda.trim()) {
      const term = `%${filtros.busqueda.trim()}%`;
      condiciones.push(`(b.descripcion ILIKE $${idx} OR u.nombre ILIKE $${idx} OR u.correo ILIKE $${idx})`);
      params.push(term);
      idx++;
    }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }
    query += ' ORDER BY b.fecha_hora DESC';

    const limite = parseInt(filtros.limite, 10);
    params.push(Number.isFinite(limite) && limite > 0 && limite <= 1000 ? limite : 200);
    query += ` LIMIT $${idx++}`;

    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = Bitacora;
