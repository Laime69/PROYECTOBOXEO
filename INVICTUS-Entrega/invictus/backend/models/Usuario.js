const pool = require('../config/database');
const bcrypt = require('bcrypt');

const USUARIO_SELECT = `
  u.id_usuario, u.nombre, u.correo, u.estado, u.fecha_creacion,
  r.nombre AS rol,
  COALESCE(al.ci, etr.ci, emp.ci) AS ci,
  COALESCE(al.fecha_nacimiento, etr.fecha_nacimiento, emp.fecha_nacimiento) AS fecha_nacimiento,
  COALESCE(al.celular, etr.celular, emp.celular) AS celular,
  COALESCE(al.direccion, etr.direccion, emp.direccion) AS direccion,
  COALESCE(etr.fecha_ingreso, emp.fecha_ingreso) AS fecha_ingreso,
  COALESCE(etr.estado_laboral, emp.estado_laboral) AS estado_laboral,
  COALESCE(etr.observaciones, emp.observaciones) AS observaciones,
  al.id_alumno        AS alumno_id,
  etr.id_entrenador   AS id_entrenador,
  emp.id_empleado     AS id_empleado,
  al.contacto_emergencia, al.celular_contacto_emergencia, al.nivel_deportivo,
  al.peso_actual, al.objetivo_entrenamiento, al.observacion_medica,
  al.fecha_inscripcion, al.fecha_vencimiento, al.estado_pago,
  etr.especialidad, etr.experiencia_anios,
  emp.cargo, emp.area, emp.turno_trabajo, emp.celular_institucional`;

const USUARIO_JOIN = `
  FROM usuarios u
  JOIN roles r ON r.id_rol = u.rol_id
  LEFT JOIN alumnos al ON al.usuario_id = u.id_usuario
  LEFT JOIN entrenadores etr ON etr.usuario_id = u.id_usuario
  LEFT JOIN empleados emp ON emp.usuario_id = u.id_usuario`;

const selectBase = (includePassword = false) =>
  `SELECT ${includePassword ? 'u.password, ' : ''}${USUARIO_SELECT} ${USUARIO_JOIN}`;

const ALUMNO_COLS = ['contacto_emergencia', 'celular_contacto_emergencia', 'nivel_deportivo', 'peso_actual', 'objetivo_entrenamiento', 'observacion_medica', 'fecha_inscripcion', 'fecha_vencimiento', 'estado_pago'];
const ENTRENADOR_COLS = ['especialidad', 'experiencia_anios', 'fecha_ingreso', 'estado_laboral', 'observaciones'];
const EMPLEADO_COLS = ['cargo', 'area', 'turno_trabajo', 'celular_institucional', 'fecha_ingreso', 'estado_laboral', 'observaciones'];

const ROL_PROFILE = {
  Alumno: 'alumnos',
  Entrenador: 'entrenadores',
  Recepcionista: 'empleados',
  Administrador: 'empleados',
  SuperAdmin: 'empleados',
};

class Usuario {
  static async findByCorreo(correo) {
    const result = await pool.query(
      `${selectBase(true)} WHERE u.correo = $1`,
      [correo]
    );
    return result.rows[0] || null;
  }

  static async findByCI(ci) {
    const result = await pool.query(
      `${selectBase()} WHERE COALESCE(al.ci, etr.ci, emp.ci) = $1`,
      [ci]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await pool.query(
      `${selectBase()} WHERE u.id_usuario = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByIdDetalle(id) {
    return Usuario.findById(id);
  }

  static async _insertarPerfil(client, usuarioId, rol, data) {
    if (rol === 'Alumno') {
      await client.query(
        `INSERT INTO alumnos (usuario_id, ci, fecha_nacimiento, celular, direccion,
           contacto_emergencia, celular_contacto_emergencia, nivel_deportivo, peso_actual,
           objetivo_entrenamiento, observacion_medica, fecha_inscripcion, fecha_vencimiento, estado_pago)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'pendiente')`,
        [usuarioId, data.ci || '', data.fecha_nacimiento || null, data.celular || '', data.direccion || '',
         data.contacto_emergencia || '', data.celular_contacto_emergencia || '', data.nivel_deportivo || 'principiante',
         data.peso_actual || 0, data.objetivo_entrenamiento || '', data.observacion_medica || '']
      );
      await client.query(
        `INSERT INTO membresias (alumno_id, tipo_plan, fecha_inicio, fecha_vencimiento, monto, estado)
         VALUES ((SELECT id_alumno FROM alumnos WHERE usuario_id = $1), 'mensual', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 200.00, 'activa')`,
        [usuarioId]
      );
    } else if (rol === 'Entrenador') {
      await client.query(
        `INSERT INTO entrenadores (usuario_id, ci, fecha_nacimiento, celular, direccion,
           especialidad, experiencia_anios, fecha_ingreso, estado_laboral, observaciones)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [usuarioId, data.ci || '', data.fecha_nacimiento || null, data.celular || '', data.direccion || '',
         data.especialidad || '', data.experiencia_anios || 0, data.fecha_ingreso || null, data.estado_laboral || 'activo', data.observaciones || '']
      );
    } else {
      await client.query(
        `INSERT INTO empleados (usuario_id, ci, fecha_nacimiento, celular, direccion,
           cargo, area, turno_trabajo, celular_institucional, fecha_ingreso, estado_laboral, observaciones)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [usuarioId, data.ci || '', data.fecha_nacimiento || null, data.celular || '', data.direccion || '',
         data.cargo || (rol === 'SuperAdmin' ? 'Super Administrador' : rol === 'Administrador' ? 'Administrador' : 'Recepcionista'),
         data.area || 'recepcion', data.turno_trabajo || '', data.celular_institucional || '',
         data.fecha_ingreso || null, data.estado_laboral || 'activo', data.observaciones || '']
      );
    }
  }

  static async create({ nombre, correo, password, rol, ci, fecha_nacimiento, celular, direccion, estado,
    contacto_emergencia, celular_contacto_emergencia, nivel_deportivo, peso_actual, objetivo_entrenamiento, observacion_medica,
    especialidad, experiencia_anios, fecha_ingreso, estado_laboral, observaciones,
    turno_trabajo, area, cargo, celular_institucional }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO usuarios (nombre, correo, password, rol_id, estado)
         VALUES ($1, $2, $3, (SELECT id_rol FROM roles WHERE nombre = $4), $5)
         RETURNING *`,
        [nombre, correo, password, rol, estado || 'activo']
      );
      const usuario = result.rows[0];

      await Usuario._insertarPerfil(client, usuario.id_usuario, rol, {
        ci, fecha_nacimiento, celular, direccion,
        contacto_emergencia, celular_contacto_emergencia, nivel_deportivo, peso_actual, objetivo_entrenamiento, observacion_medica,
        especialidad, experiencia_anios, fecha_ingreso, estado_laboral, observaciones,
        turno_trabajo, area, cargo, celular_institucional,
      });

      await client.query('COMMIT');
      return Usuario.findById(usuario.id_usuario);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAll(filtros = {}) {
    if (typeof filtros === 'string') {
      filtros = { rol: filtros };
    }
    const { rol, busqueda, estado } = filtros;
    let query = selectBase();
    const condiciones = [];
    const params = [];
    let idx = 1;

    if (rol) {
      condiciones.push(`r.nombre = $${idx++}`);
      params.push(rol);
    }
    if (busqueda && busqueda.trim()) {
      const term = `%${busqueda.trim()}%`;
      condiciones.push(`(u.nombre ILIKE $${idx} OR u.correo ILIKE $${idx} OR COALESCE(al.ci, etr.ci, emp.ci) ILIKE $${idx})`);
      params.push(term);
      idx++;
    }
    if (estado) {
      condiciones.push(`u.estado = $${idx++}`);
      params.push(estado);
    }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }
    query += ' ORDER BY u.nombre ASC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async _borrarPerfil(client, idUsuario, rol) {
    const tabla = ROL_PROFILE[rol];
    if (tabla === 'alumnos') {
      await client.query(
        `DELETE FROM pagos WHERE membresia_id IN (
           SELECT id_membresia FROM membresias WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)
         )`,
        [idUsuario]
      );
      await client.query(
        `DELETE FROM asistencias WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)`,
        [idUsuario]
      );
      await client.query(
        `DELETE FROM alumno_horarios WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)`,
        [idUsuario]
      );
      await client.query(
        `DELETE FROM evaluaciones_progreso WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)`,
        [idUsuario]
      );
      await client.query(
        `DELETE FROM historial_niveles WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)`,
        [idUsuario]
      );
      await client.query(
        `DELETE FROM membresias WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)`,
        [idUsuario]
      );
      await client.query('DELETE FROM alumnos WHERE usuario_id = $1', [idUsuario]);
    } else if (tabla === 'entrenadores') {
      await client.query('DELETE FROM entrenadores WHERE usuario_id = $1', [idUsuario]);
    } else {
      await client.query('DELETE FROM empleados WHERE usuario_id = $1', [idUsuario]);
    }
  }

  static async _upsertPerfil(client, idUsuario, rol, data, existente) {
    const v = (key, dflt) => (data[key] !== undefined ? data[key] : (existente && existente[key] !== undefined ? existente[key] : dflt));
    const colsPorRol = {
      Alumno: [
        ['ci', ''], ['fecha_nacimiento', null], ['celular', ''], ['direccion', ''],
        ...ALUMNO_COLS.map(c => [c, { contacto_emergencia: '', celular_contacto_emergencia: '', nivel_deportivo: 'principiante', peso_actual: 0, objetivo_entrenamiento: '', observacion_medica: '', fecha_inscripcion: null, fecha_vencimiento: null, estado_pago: 'pendiente' }[c]])
      ],
      Entrenador: [
        ['ci', ''], ['fecha_nacimiento', null], ['celular', ''], ['direccion', ''],
        ...ENTRENADOR_COLS.map(c => [c, { especialidad: '', experiencia_anios: 0, fecha_ingreso: null, estado_laboral: 'activo', observaciones: '' }[c]])
      ],
      Empleado: [
        ['ci', ''], ['fecha_nacimiento', null], ['celular', ''], ['direccion', ''],
        ...EMPLEADO_COLS.map(c => [c, { cargo: '', area: 'recepcion', turno_trabajo: '', celular_institucional: '', fecha_ingreso: null, estado_laboral: 'activo', observaciones: '' }[c]])
      ],
    };

    let tabla;
    let cols;
    if (rol === 'Alumno') {
      tabla = 'alumnos';
      cols = colsPorRol.Alumno;
    } else if (rol === 'Entrenador') {
      tabla = 'entrenadores';
      cols = colsPorRol.Entrenador;
    } else {
      tabla = 'empleados';
      cols = colsPorRol.Empleado;
    }

    const colNames = cols.map(c => c[0]);
    const assign = colNames.map((c, i) => `${c} = $${i + 2}`).join(', ');
    await client.query(
      `INSERT INTO ${tabla} (usuario_id, ${colNames.join(', ')})
       VALUES ($1, ${colNames.map((_, i) => `$${i + 2}`).join(', ')})
       ON CONFLICT (usuario_id) DO UPDATE SET ${assign}, updated_at = NOW()`,
      [idUsuario, ...cols.map((c) => v(c[0], c[1]))]
    );
  }

  static async update(id, data) {
    const existente = await Usuario.findById(id);
    if (!existente) return null;

    const fields = [];
    const params = [];
    let idx = 1;
    const rolFinal = data.rol || existente.rol;

    if (data.nombre !== undefined) {
      fields.push(`nombre = $${idx++}`);
      params.push(data.nombre);
    }
    if (data.correo !== undefined) {
      fields.push(`correo = $${idx++}`);
      params.push(data.correo);
    }
    if (data.password !== undefined && data.password.trim()) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(data.password, salt);
      fields.push(`password = $${idx++}`);
      params.push(hashed);
    }
    if (data.rol !== undefined) {
      fields.push(`rol_id = (SELECT id_rol FROM roles WHERE nombre = $${idx++})`);
      params.push(data.rol);
    }
    if (data.estado !== undefined) {
      fields.push(`estado = $${idx++}`);
      params.push(data.estado);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (fields.length > 0) {
        params.push(id);
        await client.query(
          `UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuario = $${idx}`,
          params
        );
      }

      if (rolFinal !== existente.rol) {
        await Usuario._borrarPerfil(client, id, existente.rol);
      }

      await Usuario._upsertPerfil(client, id, rolFinal, data, existente);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return Usuario.findById(id);
  }

  static async deleteById(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `DELETE FROM evaluaciones_progreso WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)`,
        [id]
      );
      await client.query(
        `DELETE FROM historial_niveles WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)`,
        [id]
      );
      await client.query(
        `DELETE FROM asistencias WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)`,
        [id]
      );
      await client.query(
        `DELETE FROM alumno_horarios WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)`,
        [id]
      );
      await client.query(
        `DELETE FROM pagos WHERE membresia_id IN (
           SELECT id_membresia FROM membresias WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)
         )`,
        [id]
      );
      await client.query(
        `DELETE FROM membresias WHERE alumno_id IN (SELECT id_alumno FROM alumnos WHERE usuario_id = $1)`,
        [id]
      );
      const result = await client.query(
        'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING id_usuario',
        [id]
      );
      await client.query('COMMIT');
      return result.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async countByRol(rol) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM usuarios u
       JOIN roles r ON r.id_rol = u.rol_id
       WHERE r.nombre = $1`,
      [rol]
    );
    return result.rows[0].count;
  }

  static async countPagados() {
    const hoy = new Date();
    const result = await pool.query(
      `SELECT COUNT(DISTINCT m.alumno_id)::int AS count
       FROM pagos p
       JOIN membresias m ON m.id_membresia = p.membresia_id
       WHERE p.mes = $1 AND p.anio = $2 AND p.estado = 'pagado'`,
      [hoy.getMonth() + 1, hoy.getFullYear()]
    );
    return result.rows[0].count;
  }

  static async countAll() {
    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE r.nombre = 'SuperAdmin')::int AS superadmins,
        COUNT(*) FILTER (WHERE r.nombre = 'Administrador')::int AS administradores,
        COUNT(*) FILTER (WHERE r.nombre = 'Recepcionista')::int AS recepcionistas,
        COUNT(*) FILTER (WHERE r.nombre = 'Entrenador')::int AS entrenadores,
        COUNT(*) FILTER (WHERE r.nombre = 'Alumno')::int AS alumnos
      FROM usuarios u
      JOIN roles r ON r.id_rol = u.rol_id`
    );
    return result.rows[0];
  }
}

module.exports = Usuario;