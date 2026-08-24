const pool = require('../config/database');

async function columnas(tabla) {
  const r = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    [tabla]
  );
  return new Set(r.rows.map((x) => x.column_name));
}

async function existeTabla(tabla) {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [tabla]
  );
  return r.rows.length > 0;
}

async function backfill(client, tablaPerfil, colId, sqlSelect) {
  await client.query(
    `INSERT INTO ${tablaPerfil} (${sqlSelect.columnas})
     ${sqlSelect.select}
     ON CONFLICT (${colId}) DO UPDATE SET ${sqlSelect.actualiza}`,
    sqlSelect.params
  );
}

async function main() {
  if (!(await existeTabla('usuarios'))) {
    console.error('La tabla usuarios no existe. Abortando.');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Tablas de perfiles por rol
    await client.query(`
      CREATE TABLE IF NOT EXISTS perfiles_alumnos (
        id SERIAL PRIMARY KEY,
        alumno_id INT NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        contacto_emergencia VARCHAR(100),
        celular_contacto_emergencia VARCHAR(20),
        nivel_deportivo VARCHAR(20),
        peso_actual NUMERIC(5,2),
        objetivo_entrenamiento VARCHAR(100),
        observacion_medica TEXT,
        fecha_inscripcion DATE,
        fecha_vencimiento DATE,
        estado_pago VARCHAR(20) NOT NULL DEFAULT 'pendiente',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS perfiles_entrenadores (
        id SERIAL PRIMARY KEY,
        entrenador_id INT NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        especialidad VARCHAR(100),
        experiencia_anios INT DEFAULT 0,
        fecha_ingreso DATE,
        estado_laboral VARCHAR(20) DEFAULT 'activo',
        observaciones TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS perfiles_recepcionistas (
        id SERIAL PRIMARY KEY,
        recepcionista_id INT NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        turno_trabajo VARCHAR(20),
        area VARCHAR(50) DEFAULT 'recepcion',
        fecha_ingreso DATE,
        estado_laboral VARCHAR(20) DEFAULT 'activo',
        observaciones TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS perfiles_administradores (
        id SERIAL PRIMARY KEY,
        administrador_id INT NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        cargo VARCHAR(100),
        celular_institucional VARCHAR(20),
        fecha_ingreso DATE,
        estado_laboral VARCHAR(20) DEFAULT 'activo',
        observaciones TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);

    // 2) Copia de datos legado (solo las columnas que existan en usuarios)
    const ucols = await columnas('usuarios');
    const COLS_ALUMNO = ['contacto_emergencia', 'celular_contacto_emergencia', 'nivel_deportivo', 'peso_actual', 'objetivo_entrenamiento', 'observacion_medica', 'fecha_inscripcion', 'fecha_vencimiento', 'estado_pago'];
    const COLS_ENTRENADOR = ['especialidad', 'experiencia_anios', 'fecha_ingreso', 'estado_laboral', 'observaciones'];
    const COLS_RECEPCIONISTA = ['turno_trabajo', 'area', 'fecha_ingreso', 'estado_laboral', 'observaciones'];
    const COLS_ADMIN = ['cargo', 'celular_institucional', 'fecha_ingreso', 'estado_laboral', 'observaciones'];

    const build = (perfil, colId, cols, rol) => {
      const presentes = cols.filter((c) => ucols.has(c));
      if (presentes.length === 0) return null;
      const select = presentes.map((c) => `u.${c}`).join(', ');
      const actualiza = presentes.map((c) => `${c} = EXCLUDED.${c}`).join(', ');
      return {
        columnas: `${colId}, ${presentes.join(', ')}`,
        select: `SELECT u.id_usuario, ${select} FROM usuarios u WHERE u.rol = '${rol}' AND u.id_usuario IS NOT NULL`,
        actualiza,
        params: [],
      };
    };

    const sqlAlumno = build('perfiles_alumnos', 'alumno_id', COLS_ALUMNO, 'Alumno');
    if (sqlAlumno) await backfill(client, 'perfiles_alumnos', 'alumno_id', sqlAlumno);

    const sqlEntrenador = build('perfiles_entrenadores', 'entrenador_id', COLS_ENTRENADOR, 'Entrenador');
    if (sqlEntrenador) await backfill(client, 'perfiles_entrenadores', 'entrenador_id', sqlEntrenador);

    const sqlRecepcionista = build('perfiles_recepcionistas', 'recepcionista_id', COLS_RECEPCIONISTA, 'Recepcionista');
    if (sqlRecepcionista) await backfill(client, 'perfiles_recepcionistas', 'recepcionista_id', sqlRecepcionista);

    const sqlAdmin = build('perfiles_administradores', 'administrador_id', COLS_ADMIN, 'SuperAdmin');
    if (sqlAdmin) await backfill(client, 'perfiles_administradores', 'administrador_id', sqlAdmin);

    // 3) Horarios: normalizar dia_semana/turno desde columnas legado y quitar redundancias
    if (await existeTabla('horarios')) {
      const hcols = await columnas('horarios');
      if (hcols.has('dia')) {
        await client.query(
          `UPDATE horarios SET dia_semana = LOWER(TRIM(BOTH FROM dia)) WHERE dia_semana IS NULL AND dia IS NOT NULL`
        );
      }
      if (hcols.has('nombre_turno')) {
        await client.query(
          `UPDATE horarios SET turno = LOWER(TRANSLATE(nombre_turno, 'ÁÉÍÓÚáéíóúñ', 'AEIOUaeionu')) WHERE turno IS NULL AND nombre_turno IS NOT NULL`
        );
        await client.query(`UPDATE horarios SET turno = 'manana' WHERE turno = 'mañana'`);
      }
      await client.query(`ALTER TABLE horarios DROP COLUMN IF EXISTS dia`);
      await client.query(`ALTER TABLE horarios DROP COLUMN IF EXISTS nombre_turno`);
      await client.query(`ALTER TABLE horarios DROP COLUMN IF EXISTS dias`);
      const c = await client.query(
        `SELECT 1 FROM pg_constraint WHERE conname = 'horarios_dia_semana_turno_key'`
      );
      if (c.rows.length === 0) {
        await client.query(`ALTER TABLE horarios ADD CONSTRAINT horarios_dia_semana_turno_key UNIQUE (dia_semana, turno)`);
      }
    }

    // 4) asistencias: garantizar horario_id
    if (await existeTabla('asistencias')) {
      const acols = await columnas('asistencias');
      if (!acols.has('horario_id')) {
        await client.query(`ALTER TABLE asistencias ADD COLUMN horario_id INT REFERENCES horarios(id_horario) ON DELETE SET NULL`);
      }
    }

    // 5) Quitar columnas por rol que ahora viven en perfiles_*
    const LEGACY = [
      'estado_pago', 'fecha_inscripcion', 'fecha_vencimiento', 'fecha_inicio',
      'contacto_emergencia', 'celular_contacto_emergencia', 'nivel_deportivo',
      'peso_actual', 'objetivo_entrenamiento', 'observacion_medica',
      'especialidad', 'experiencia_anios', 'fecha_ingreso', 'estado_laboral',
      'observaciones', 'turno_trabajo', 'area', 'cargo', 'celular_institucional',
    ];
    for (const col of LEGACY) {
      if (ucols.has(col)) {
        await client.query(`ALTER TABLE usuarios DROP COLUMN ${col}`);
      }
    }

    await client.query('COMMIT');
    console.log('Migración de normalización completada correctamente.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migración falló, se revirtieron los cambios:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
