-- ============================================================
--  MIGRACIÓN DE NORMALIZACIÓN — Academia de Boxeo Invictus
--  Transforma la base existente al esquema normalizado:
--   1. Separa usuarios (identidad) de los perfiles por rol.
--   2. Mueve los datos de pago/deportivos a perfiles_alumnos.
--   3. Elimina columnas redundantes de usuarios.
--   4. Elimina columnas duplicadas de horarios.
--   5. Agrega la FK faltante asistencias.horario_id.
--  Es IDEMPOTENTE: se puede ejecutar varias veces sin romper.
--  Ejecutar: psql -U postgres -d invictus_boxeo -f migracion_normalizacion.sql
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Asegurar que las columnas a mover existan en usuarios
--    (corrige el bug: algunos entornos nunca las tuvieron)
-- ------------------------------------------------------------
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_inscripcion DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(20) DEFAULT 'pendiente';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS contacto_emergencia VARCHAR(100) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS celular_contacto_emergencia VARCHAR(20) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nivel_deportivo VARCHAR(30) DEFAULT 'principiante';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS peso_actual DECIMAL(5,2) DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS objetivo_entrenamiento VARCHAR(255) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS observacion_medica TEXT DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS especialidad VARCHAR(100) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS experiencia_anios INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_ingreso DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS estado_laboral VARCHAR(20) DEFAULT 'activo';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS observaciones TEXT DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS turno_trabajo VARCHAR(10) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS area VARCHAR(50) DEFAULT 'recepcion';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cargo VARCHAR(100) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS celular_institucional VARCHAR(20) DEFAULT '';

-- ------------------------------------------------------------
-- 2. Crear las tablas de perfil (1:1 con usuarios)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfiles_alumnos (
  alumno_id INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  contacto_emergencia VARCHAR(100) DEFAULT '',
  celular_contacto_emergencia VARCHAR(20) DEFAULT '',
  nivel_deportivo VARCHAR(30) DEFAULT 'principiante',
  peso_actual DECIMAL(5,2) DEFAULT 0,
  objetivo_entrenamiento VARCHAR(255) DEFAULT '',
  observacion_medica TEXT DEFAULT '',
  fecha_inscripcion DATE,
  fecha_vencimiento DATE,
  estado_pago VARCHAR(20) DEFAULT 'pendiente'
    CHECK (estado_pago IN ('pendiente', 'pagado', 'vencido')),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS perfiles_entrenadores (
  entrenador_id INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  especialidad VARCHAR(100) DEFAULT '',
  experiencia_anios INTEGER DEFAULT 0,
  fecha_ingreso DATE,
  estado_laboral VARCHAR(20) DEFAULT 'activo',
  observaciones TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS perfiles_recepcionistas (
  recepcionista_id INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  turno_trabajo VARCHAR(10) DEFAULT '',
  area VARCHAR(50) DEFAULT 'recepcion',
  fecha_ingreso DATE,
  estado_laboral VARCHAR(20) DEFAULT 'activo',
  observaciones TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS perfiles_administradores (
  administrador_id INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  cargo VARCHAR(100) DEFAULT '',
  celular_institucional VARCHAR(20) DEFAULT '',
  fecha_ingreso DATE,
  estado_laboral VARCHAR(20) DEFAULT 'activo',
  observaciones TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. Migrar los datos de usuarios → perfiles
-- ------------------------------------------------------------
INSERT INTO perfiles_alumnos (alumno_id, contacto_emergencia, celular_contacto_emergencia,
  nivel_deportivo, peso_actual, objetivo_entrenamiento, observacion_medica,
  fecha_inscripcion, fecha_vencimiento, estado_pago)
SELECT id_usuario, contacto_emergencia, celular_contacto_emergencia,
  nivel_deportivo, peso_actual, objetivo_entrenamiento, observacion_medica,
  fecha_inscripcion, fecha_vencimiento, estado_pago
FROM usuarios WHERE rol = 'Alumno'
ON CONFLICT (alumno_id) DO NOTHING;

INSERT INTO perfiles_entrenadores (entrenador_id, especialidad, experiencia_anios,
  fecha_ingreso, estado_laboral, observaciones)
SELECT id_usuario, especialidad, experiencia_anios, fecha_ingreso, estado_laboral, observaciones
FROM usuarios WHERE rol = 'Entrenador'
ON CONFLICT (entrenador_id) DO NOTHING;

INSERT INTO perfiles_recepcionistas (recepcionista_id, turno_trabajo, area,
  fecha_ingreso, estado_laboral, observaciones)
SELECT id_usuario, turno_trabajo, area, fecha_ingreso, estado_laboral, observaciones
FROM usuarios WHERE rol = 'Recepcionista'
ON CONFLICT (recepcionista_id) DO NOTHING;

INSERT INTO perfiles_administradores (administrador_id, cargo, celular_institucional,
  fecha_ingreso, estado_laboral, observaciones)
SELECT id_usuario, cargo, celular_institucional, fecha_ingreso, estado_laboral, observaciones
FROM usuarios WHERE rol IN ('Administrador', 'SuperAdmin')
ON CONFLICT (administrador_id) DO NOTHING;

-- ------------------------------------------------------------
-- 4. Eliminar columnas redundantes de usuarios
--    (ahora viven en las tablas de perfil)
-- ------------------------------------------------------------
ALTER TABLE usuarios DROP COLUMN IF EXISTS fecha_inscripcion;
ALTER TABLE usuarios DROP COLUMN IF EXISTS fecha_vencimiento;
ALTER TABLE usuarios DROP COLUMN IF EXISTS estado_pago;
ALTER TABLE usuarios DROP COLUMN IF EXISTS contacto_emergencia;
ALTER TABLE usuarios DROP COLUMN IF EXISTS celular_contacto_emergencia;
ALTER TABLE usuarios DROP COLUMN IF EXISTS nivel_deportivo;
ALTER TABLE usuarios DROP COLUMN IF EXISTS peso_actual;
ALTER TABLE usuarios DROP COLUMN IF EXISTS objetivo_entrenamiento;
ALTER TABLE usuarios DROP COLUMN IF EXISTS observacion_medica;
ALTER TABLE usuarios DROP COLUMN IF EXISTS especialidad;
ALTER TABLE usuarios DROP COLUMN IF EXISTS experiencia_anios;
ALTER TABLE usuarios DROP COLUMN IF EXISTS fecha_ingreso;
ALTER TABLE usuarios DROP COLUMN IF EXISTS estado_laboral;
ALTER TABLE usuarios DROP COLUMN IF EXISTS observaciones;
ALTER TABLE usuarios DROP COLUMN IF EXISTS turno_trabajo;
ALTER TABLE usuarios DROP COLUMN IF EXISTS area;
ALTER TABLE usuarios DROP COLUMN IF EXISTS cargo;
ALTER TABLE usuarios DROP COLUMN IF EXISTS celular_institucional;

-- ------------------------------------------------------------
-- 5. Normalizar horarios: solo dia_semana + turno
--    (dia / nombre_turno / dias eran duplicados)
-- ------------------------------------------------------------
ALTER TABLE horarios ADD COLUMN IF NOT EXISTS dia_semana VARCHAR(15);
ALTER TABLE horarios ADD COLUMN IF NOT EXISTS turno VARCHAR(10);

-- Rellenar con datos legacy si faltan
UPDATE horarios SET dia_semana = LOWER(
  CASE dia
    WHEN 'Miércoles' THEN 'miercoles'
    ELSE dia
  END
) WHERE dia_semana IS NULL AND dia IS NOT NULL;

UPDATE horarios SET turno = LOWER(nombre_turno) WHERE turno IS NULL AND nombre_turno IS NOT NULL;
UPDATE horarios SET turno = CASE
  WHEN hora_inicio < '12:00' THEN 'manana'
  WHEN hora_inicio < '17:00' THEN 'tarde'
  ELSE 'noche'
END WHERE turno IS NULL;

-- Eliminar duplicados de (dia_semana, turno) antes de la restricción única
DELETE FROM horarios a
USING horarios b
WHERE a.id_horario > b.id_horario
  AND a.dia_semana = b.dia_semana
  AND a.turno = b.turno;

ALTER TABLE horarios ALTER COLUMN dia_semana SET NOT NULL;
ALTER TABLE horarios ALTER COLUMN turno SET NOT NULL;

-- Columna que ya no existe en el esquema normalizado
ALTER TABLE horarios DROP COLUMN IF EXISTS dia;
ALTER TABLE horarios DROP COLUMN IF EXISTS nombre_turno;
ALTER TABLE horarios DROP COLUMN IF EXISTS dias;

-- Restricción de unicidad (dia_semana, turno)
CREATE UNIQUE INDEX IF NOT EXISTS uq_horarios_dia_turno ON horarios(dia_semana, turno);

-- ------------------------------------------------------------
-- 6. FK faltante: asistencias.horario_id
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_asistencias_horario' AND conrelid = 'asistencias'::regclass
  ) THEN
    ALTER TABLE asistencias
      ADD CONSTRAINT fk_asistencias_horario
      FOREIGN KEY (horario_id) REFERENCES horarios(id_horario) ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 7. Asegurar que el CHECK de rol incluya los 5 roles
-- ------------------------------------------------------------
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno'));

COMMIT;

-- Mensaje de confirmación
SELECT 'Migración de normalización completada' AS resultado;
