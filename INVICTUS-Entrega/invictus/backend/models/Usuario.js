const pool = require('../config/database');

const PROFILE_COLS = `
  u.id_usuario, u.nombre, u.correo, u.rol, u.ci, u.fecha_nacimiento,
  u.celular, u.direccion, u.estado, u.fecha_creacion,
  pal.contacto_emergencia, pal.celular_contacto_emergencia, pal.nivel_deportivo,
  pal.peso_actual, pal.objetivo_entrenamiento, pal.observacion_medica,
  pal.fecha_inscripcion, pal.fecha_vencimiento, pal.estado_pago,
  pe.especialidad, pe.experiencia_anios, pe.fecha_ingreso, pe.estado_laboral, pe.observaciones,
  pr.turno_trabajo, pr.area,
  pad.cargo, pad.celular_institucional`;

const PROFILE_JOIN = `
  FROM usuarios u
  LEFT JOIN perfiles_alumnos pal ON pal.alumno_id = u.id_usuario
  LEFT JOIN perfiles_entrenadores pe ON pe.entrenador_id = u.id_usuario
  LEFT JOIN perfiles_recepcionistas pr ON pr.recepcionista_id = u.id_usuario
  LEFT JOIN perfiles_administradores pad ON pad.administrador_id = u.id_usuario`;

const selectBase = (includePassword = false) =>
  `SELECT ${includePassword ? 'u.password, ' : ''}${PROFILE_COLS} ${PROFILE_JOIN}`;

const ALUMNO_COLS = ['contacto_emergencia', 'celular_contacto_emergencia', 'nivel_deportivo', 'peso_actual', 'objetivo_entrenamiento', 'observacion_medica', 'fecha_inscripcion', 'fecha_vencimiento', 'estado_pago'];
const ENTRENADOR_COLS = ['especialidad', 'experiencia_anios', 'fecha_ingreso', 'estado_laboral', 'observaciones'];
const RECEPCIONISTA_COLS = ['turno_trabajo', 'area'];
const ADMIN_COLS = ['cargo', 'celular_institucional'];

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
      `${selectBase()} WHERE u.ci = $1 AND u.ci != ''`,
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
    const result = await pool.query(
      `${selectBase()} WHERE u.id_usuario = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async create({ nombre, correo, password, rol, ci, fecha_nacimiento, celular, direccion, estado,
    contacto_emergencia, celular_contacto_emergencia, nivel_deportivo, peso_actual, objetivo_entrenamiento, observacion_medica,
    especialidad, experiencia_anios, fecha_ingreso, estado_laboral, observaciones,
    turno_trabajo, area, cargo, celular_institucional }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO usuarios (nombre, correo, password, rol, ci, fecha_nacimiento, celular, direccion, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [nombre, correo, password, rol, ci || '', fecha_nacimiento || '2000-01-01', celular || '', direccion || '', estado || 'activo']
      );
      const usuario = result.rows[0];

      if (rol === 'Alumno') {
        await client.query(
          `INSERT INTO perfiles_alumnos (alumno_id, contacto_emergencia, celular_contacto_emergencia, nivel_deportivo, peso_actual, objetivo_entrenamiento, observacion_medica, fecha_inscripcion, fecha_vencimiento, estado_pago)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'pendiente')`,
          [usuario.id_usuario, contacto_emergencia || '', celular_contacto_emergencia || '', nivel_deportivo || 'principiante', peso_actual || 0, objetivo_entrenamiento || '', observacion_medica || '']
        );
      } else if (rol === 'Entrenador') {
        await client.query(
          `INSERT INTO perfiles_entrenadores (entrenador_id, especialidad, experiencia_anios, fecha_ingreso, estado_laboral, observaciones)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [usuario.id_usuario, especialidad || '', experiencia_anios || 0, fecha_ingreso || null, estado_laboral || 'activo', observaciones || '']
        );
      } else if (rol === 'Recepcionista') {
        await client.query(
          `INSERT INTO perfiles_recepcionistas (recepcionista_id, turno_trabajo, area, fecha_ingreso, estado_laboral, observaciones)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [usuario.id_usuario, turno_trabajo || '', area || 'recepcion', fecha_ingreso || null, estado_laboral || 'activo', observaciones || '']
        );
      } else {
        await client.query(
          `INSERT INTO perfiles_administradores (administrador_id, cargo, celular_institucional, fecha_ingreso, estado_laboral, observaciones)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [usuario.id_usuario, cargo || '', celular_institucional || '', fecha_ingreso || null, estado_laboral || 'activo', observaciones || '']
        );
      }

      await client.query('COMMIT');
      return usuario;
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
      condiciones.push(`u.rol = $${idx++}`);
      params.push(rol);
    }
    if (busqueda && busqueda.trim()) {
      const term = `%${busqueda.trim()}%`;
      condiciones.push(`(u.nombre ILIKE $${idx} OR u.correo ILIKE $${idx} OR u.ci ILIKE $${idx})`);
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

  static async _upsertPerfil(client, id, rol, data, existente) {
    const v = (key, dflt) => (data[key] !== undefined ? data[key] : (existente && existente[key] !== undefined ? existente[key] : dflt));

    if (rol === 'Alumno') {
      const cols = ['contacto_emergencia', 'celular_contacto_emergencia', 'nivel_deportivo', 'peso_actual', 'objetivo_entrenamiento', 'observacion_medica', 'fecha_inscripcion', 'fecha_vencimiento', 'estado_pago'];
      const dflts = ['', '', 'principiante', 0, '', '', null, null, 'pendiente'];
      const assign = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
      await client.query(
        `INSERT INTO perfiles_alumnos (alumno_id, ${cols.join(', ')})
         VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')})
         ON CONFLICT (alumno_id) DO UPDATE SET ${assign}, updated_at = NOW()`,
        [id, ...cols.map((c, i) => v(c, dflts[i]))]
      );
    } else if (rol === 'Entrenador') {
      const cols = ['especialidad', 'experiencia_anios', 'fecha_ingreso', 'estado_laboral', 'observaciones'];
      const dflts = ['', 0, null, 'activo', ''];
      const assign = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
      await client.query(
        `INSERT INTO perfiles_entrenadores (entrenador_id, ${cols.join(', ')})
         VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')})
         ON CONFLICT (entrenador_id) DO UPDATE SET ${assign}, updated_at = NOW()`,
        [id, ...cols.map((c, i) => v(c, dflts[i]))]
      );
    } else if (rol === 'Recepcionista') {
      const cols = ['turno_trabajo', 'area', 'fecha_ingreso', 'estado_laboral', 'observaciones'];
      const dflts = ['', 'recepcion', null, 'activo', ''];
      const assign = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
      await client.query(
        `INSERT INTO perfiles_recepcionistas (recepcionista_id, ${cols.join(', ')})
         VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')})
         ON CONFLICT (recepcionista_id) DO UPDATE SET ${assign}, updated_at = NOW()`,
        [id, ...cols.map((c, i) => v(c, dflts[i]))]
      );
    } else {
      const cols = ['cargo', 'celular_institucional', 'fecha_ingreso', 'estado_laboral', 'observaciones'];
      const dflts = ['', '', null, 'activo', ''];
      const assign = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
      await client.query(
        `INSERT INTO perfiles_administradores (administrador_id, ${cols.join(', ')})
         VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')})
         ON CONFLICT (administrador_id) DO UPDATE SET ${assign}, updated_at = NOW()`,
        [id, ...cols.map((c, i) => v(c, dflts[i]))]
      );
    }
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
      const salt = await require('bcrypt').genSalt(10);
      const hashed = await require('bcrypt').hash(data.password, salt);
      fields.push(`password = $${idx++}`);
      params.push(hashed);
    }
    if (data.rol !== undefined) {
      fields.push(`rol = $${idx++}`);
      params.push(data.rol);
    }
    if (data.ci !== undefined) {
      fields.push(`ci = $${idx++}`);
      params.push(data.ci);
    }
    if (data.fecha_nacimiento !== undefined) {
      fields.push(`fecha_nacimiento = $${idx++}`);
      params.push(data.fecha_nacimiento);
    }
    if (data.celular !== undefined) {
      fields.push(`celular = $${idx++}`);
      params.push(data.celular);
    }
    if (data.direccion !== undefined) {
      fields.push(`direccion = $${idx++}`);
      params.push(data.direccion);
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

      // Si cambió el rol, limpiar el perfil anterior
      if (rolFinal !== existente.rol) {
        if (existente.rol === 'Alumno') await client.query('DELETE FROM perfiles_alumnos WHERE alumno_id = $1', [id]);
        if (existente.rol === 'Entrenador') await client.query('DELETE FROM perfiles_entrenadores WHERE entrenador_id = $1', [id]);
        if (existente.rol === 'Recepcionista') await client.query('DELETE FROM perfiles_recepcionistas WHERE recepcionista_id = $1', [id]);
        if (existente.rol === 'Administrador' || existente.rol === 'SuperAdmin') await client.query('DELETE FROM perfiles_administradores WHERE administrador_id = $1', [id]);
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
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING id_usuario',
      [id]
    );
    return result.rows[0] || null;
  }

  static async countByRol(rol) {
    const result = await pool.query(
      'SELECT COUNT(*)::int AS count FROM usuarios WHERE rol = $1',
      [rol]
    );
    return result.rows[0].count;
  }

  static async countPagados() {
    const result = await pool.query(
      "SELECT COUNT(*)::int AS count FROM perfiles_alumnos WHERE estado_pago = 'pagado'"
    );
    return result.rows[0].count;
  }

  static async countAll() {
    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE rol = 'SuperAdmin')::int AS superadmins,
        COUNT(*) FILTER (WHERE rol = 'Administrador')::int AS administradores,
        COUNT(*) FILTER (WHERE rol = 'Recepcionista')::int AS recepcionistas,
        COUNT(*) FILTER (WHERE rol = 'Entrenador')::int AS entrenadores,
        COUNT(*) FILTER (WHERE rol = 'Alumno')::int AS alumnos
      FROM usuarios`
    );
    return result.rows[0];
  }
}

module.exports = Usuario;
