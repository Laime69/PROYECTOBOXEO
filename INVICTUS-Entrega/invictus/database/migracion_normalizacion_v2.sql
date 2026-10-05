-- ============================================================
--  NORMALIZACIÓN V2 — Academia de Boxeo Invictus
--
--  NO DESTRUCTIVA · TRANSACCIONAL · IDEMPOTENTE
--  (si ya se aplicó, aborta sin tocar nada)
--
--  Hace:
--   1. Tabla `roles` + usuarios.rol_id (catálogo, rol único por usuario)
--   2. perfiles_alumnos      → alumnos      (PK id_alumno, usuario_id UNIQUE)
--      perfiles_entrenadores → entrenadores (PK id_entrenador, usuario_id UNIQUE)
--      empleados nuevo       (merge recepcionistas + administradores)
--   3. Mueve ci/fecha_nacimiento/celular/direccion de usuarios a los perfiles
--   4. membresias (1 por alumno) + pagos.membresia_id
--   5. Remapea FKs hijas → alumnos(id_alumno) / entrenadores(id_entrenador)
--      (horarios, alumno_horarios, asistencias, evaluaciones_progreso,
--       historial_niveles)
--   6. UNIQUE(dia_semana, nombre_turno), UNIQUE alumno+horario (activo),
--      UNIQUE(asistencias: alumno, horario, fecha), UNIQUE(pagos: membresia, mes, anio)
--
--  Las columnas que el código viejo sigue usando (usuarios.rol, usuarios.ci,
--  asistencias.entrenador_id, alumno_horarios.turno, pagos.mes/anio/alumno_id)
--  se ELIMINAN en migracion_limpieza_final.sql, tras actualizar el backend.
--  Respaldo previo recomendado:
--    pg_dump -h localhost -U postgres -d invictus_boxeo -Fc -f backups/backup.dump
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 0. Guarda de idempotencia: aborta si ya se aplicó
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'alumnos'
  ) THEN
    RAISE EXCEPTION 'Normalización V2 ya aplicada (tabla alumnos existe).';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 1. Tabla roles + usuarios.rol_id
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id_rol     SERIAL PRIMARY KEY,
  nombre     VARCHAR(50) NOT NULL UNIQUE
    CHECK (nombre IN ('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno')),
  descripcion VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (nombre, descripcion) VALUES
  ('SuperAdmin',     'Super administrador con acceso total'),
  ('Administrador',  'Administrador del sistema'),
  ('Recepcionista',  'Recepcionista de la academia'),
  ('Entrenador',     'Entrenador deportivo'),
  ('Alumno',         'Alumno inscrito en la academia')
ON CONFLICT (nombre) DO NOTHING;

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol_id INT REFERENCES roles(id_rol);
UPDATE usuarios u
SET rol_id = r.id_rol
FROM roles r
WHERE r.nombre = u.rol AND u.rol_id IS NULL;

-- Soporte para roles que no estén siendel CHECK (p.ej. 'SuperAdmin' faltante)
UPDATE usuarios u
SET rol_id = (SELECT id_rol FROM roles WHERE nombre = 'Administrador')
WHERE u.rol_id IS NULL;

ALTER TABLE usuarios ALTER COLUMN rol_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);

-- ------------------------------------------------------------
-- 2. perfiles_alumnos → alumnos
-- ------------------------------------------------------------
ALTER TABLE perfiles_alumnos RENAME TO alumnos;
ALTER TABLE alumnos RENAME COLUMN alumno_id TO usuario_id;
ALTER TABLE alumnos RENAME CONSTRAINT perfiles_alumnos_alumno_id_fkey TO alumnos_usuario_id_fkey;

ALTER TABLE alumnos DROP CONSTRAINT IF EXISTS perfiles_alumnos_pkey;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS id_alumno SERIAL;
ALTER TABLE alumnos ADD CONSTRAINT alumnos_pkey PRIMARY KEY (id_alumno);
ALTER TABLE alumnos ALTER COLUMN usuario_id SET NOT NULL;
ALTER TABLE alumnos ADD CONSTRAINT alumnos_usuario_id_key UNIQUE (usuario_id);

ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ------------------------------------------------------------
-- 3. perfiles_entrenadores → entrenadores
-- ------------------------------------------------------------
ALTER TABLE perfiles_entrenadores RENAME TO entrenadores;
ALTER TABLE entrenadores RENAME COLUMN entrenador_id TO usuario_id;
ALTER TABLE entrenadores RENAME CONSTRAINT perfiles_entrenadores_entrenador_id_fkey TO entrenadores_usuario_id_fkey;

ALTER TABLE entrenadores DROP CONSTRAINT IF EXISTS perfiles_entrenadores_pkey;
ALTER TABLE entrenadores ADD COLUMN IF NOT EXISTS id_entrenador SERIAL;
ALTER TABLE entrenadores ADD CONSTRAINT entrenadores_pkey PRIMARY KEY (id_entrenador);
ALTER TABLE entrenadores ALTER COLUMN usuario_id SET NOT NULL;
ALTER TABLE entrenadores ADD CONSTRAINT entrenadores_usuario_id_key UNIQUE (usuario_id);

ALTER TABLE entrenadores ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE entrenadores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ------------------------------------------------------------
-- 4. empleados (merge recepcionistas + administradores)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empleados (
  id_empleado        SERIAL PRIMARY KEY,
  usuario_id         INT NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  ci                 VARCHAR(20),
  fecha_nacimiento   DATE,
  celular            VARCHAR(20),
  direccion          VARCHAR(255),
  cargo              VARCHAR(100),
  area               VARCHAR(50)  DEFAULT 'recepcion',
  turno_trabajo      VARCHAR(20),
  celular_institucional VARCHAR(20),
  fecha_ingreso      DATE,
  estado_laboral     VARCHAR(20)  DEFAULT 'activo',
  observaciones      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO empleados (
  usuario_id, ci, fecha_nacimiento, celular, direccion,
  area, turno_trabajo, fecha_ingreso, estado_laboral, observaciones)
SELECT u.id_usuario, u.ci, u.fecha_nacimiento, u.celular, u.direccion,
       COALESCE(pr.area, 'recepcion'), pr.turno_trabajo,
       pr.fecha_ingreso, pr.estado_laboral, pr.observaciones
FROM perfiles_recepcionistas pr
JOIN usuarios u ON u.id_usuario = pr.recepcionista_id
WHERE NOT EXISTS (SELECT 1 FROM empleados e WHERE e.usuario_id = u.id_usuario);

INSERT INTO empleados (
  usuario_id, ci, fecha_nacimiento, celular, direccion,
  cargo, celular_institucional, fecha_ingreso, estado_laboral, observaciones)
SELECT u.id_usuario, u.ci, u.fecha_nacimiento, u.celular, u.direccion,
       COALESCE(pa.cargo, 'Administrativo'), pa.celular_institucional,
       pa.fecha_ingreso, pa.estado_laboral, pa.observaciones
FROM perfiles_administradores pa
JOIN usuarios u ON u.id_usuario = pa.administrador_id
WHERE NOT EXISTS (SELECT 1 FROM empleados e WHERE e.usuario_id = u.id_usuario);

-- Verificación: todo usuario con rol de empleado debe tener fila en empleados
INSERT INTO empleados (usuario_id, ci, fecha_nacimiento, celular, direccion, cargo)
SELECT u.id_usuario, u.ci, u.fecha_nacimiento, u.celular, u.direccion,
       CASE u.rol WHEN 'SuperAdmin' THEN 'Super Administrador' WHEN 'Administrador' THEN 'Administrador' ELSE 'Recepcionista' END
FROM usuarios u
WHERE u.rol IN ('SuperAdmin', 'Administrador', 'Recepcionista')
  AND NOT EXISTS (SELECT 1 FROM empleados e WHERE e.usuario_id = u.id_usuario);
UPDATE empleados e
SET cargo = CASE WHEN e.cargo IS NULL THEN 'Administrativo' ELSE e.cargo END
WHERE e.cargo IS NULL;

-- ------------------------------------------------------------
-- 5. Datos comunes de identidad: usuarios → perfiles
--    (no se borran de usuarios hasta la limpieza final)
-- ------------------------------------------------------------
ALTER TABLE alumnos      ADD COLUMN IF NOT EXISTS ci VARCHAR(20);
ALTER TABLE alumnos      ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE alumnos      ADD COLUMN IF NOT EXISTS celular VARCHAR(20);
ALTER TABLE alumnos      ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);
UPDATE alumnos a
SET ci = u.ci, fecha_nacimiento = u.fecha_nacimiento, celular = u.celular, direccion = u.direccion
FROM usuarios u WHERE u.id_usuario = a.usuario_id;

ALTER TABLE entrenadores ADD COLUMN IF NOT EXISTS ci VARCHAR(20);
ALTER TABLE entrenadores ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE entrenadores ADD COLUMN IF NOT EXISTS celular VARCHAR(20);
ALTER TABLE entrenadores ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);
UPDATE entrenadores e
SET ci = u.ci, fecha_nacimiento = u.fecha_nacimiento, celular = u.celular, direccion = u.direccion
FROM usuarios u WHERE u.id_usuario = e.usuario_id;

-- ------------------------------------------------------------
-- 6. membresias (1 por alumno) + pagos.membresia_id
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS membresias (
  id_membresia     SERIAL PRIMARY KEY,
  alumno_id        INT NOT NULL REFERENCES alumnos(id_alumno) ON DELETE RESTRICT,
  tipo_plan        VARCHAR(50) NOT NULL DEFAULT 'mensual',
  fecha_inicio     DATE NOT NULL,
  fecha_vencimiento DATE,
  monto            NUMERIC(10,2) NOT NULL DEFAULT 200.00,
  estado           VARCHAR(20) NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa', 'inactiva', 'vencida', 'suspendida')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_membresias_alumno ON membresias(alumno_id);

INSERT INTO membresias (alumno_id, tipo_plan, fecha_inicio, fecha_vencimiento, monto, estado)
WITH per_alumno AS (
  SELECT a.id_alumno,
         COALESCE(MIN(p.fecha_pago), a.fecha_inscripcion, CURRENT_DATE) AS inicio,
         MAX(p.fecha_vencimiento) FILTER (WHERE p.estado = 'pagado')  AS vence,
         EXISTS (SELECT 1 FROM pagos p2
                 WHERE p2.alumno_id = a.usuario_id AND p2.estado = 'vencido') AS vencido
  FROM alumnos a
  LEFT JOIN pagos p ON p.alumno_id = a.usuario_id
  GROUP BY a.id_alumno, a.fecha_inscripcion
)
SELECT a.id_alumno,
       'mensual',
       (per.inicio::date),
       COALESCE(per.vence::date, (per.inicio + INTERVAL '1 month')::date),
       200.00,
       CASE WHEN per.vencido THEN 'vencida' ELSE 'activa' END
FROM per_alumno per
JOIN alumnos a USING (id_alumno)
WHERE NOT EXISTS (SELECT 1 FROM membresias m WHERE m.alumno_id = a.id_alumno);

-- backfill fecha_pago de los pagos sin fecha (deriva de mes/anio o vencimiento)
UPDATE pagos
SET fecha_pago = (make_date(anio, mes, 1) + INTERVAL '2 days')::date
WHERE fecha_pago IS NULL;

ALTER TABLE pagos ADD COLUMN IF NOT EXISTS membresia_id INT;
UPDATE pagos p
SET membresia_id = m.id_membresia
FROM alumnos a
JOIN membresias m ON m.alumno_id = a.id_alumno
WHERE p.alumno_id = a.usuario_id AND p.membresia_id IS NULL;
ALTER TABLE pagos ALTER COLUMN membresia_id SET NOT NULL;
ALTER TABLE pagos ADD CONSTRAINT pagos_membresia_id_fkey
  FOREIGN KEY (membresia_id) REFERENCES membresias(id_membresia) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_pagos_membresia ON pagos(membresia_id);

-- UNIQUE de periodo por membresía (mes/anio aún existen)
ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_alumno_id_mes_anio_key;
ALTER TABLE pagos ADD CONSTRAINT pagos_membresia_mes_anio_key UNIQUE (membresia_id, mes, anio);

-- ------------------------------------------------------------
-- 7. horarios: entrenador_id → entrenadores · turno → nombre_turno
-- ------------------------------------------------------------
ALTER TABLE horarios ADD COLUMN IF NOT EXISTS entrenador_id_new INT;
UPDATE horarios h
SET entrenador_id_new = e.id_entrenador
FROM entrenadores e WHERE e.usuario_id = h.entrenador_id;
ALTER TABLE horarios DROP CONSTRAINT IF EXISTS horarios_entrenador_id_fkey;
ALTER TABLE horarios DROP COLUMN IF EXISTS entrenador_id;
ALTER TABLE horarios RENAME COLUMN entrenador_id_new TO entrenador_id;
ALTER TABLE horarios ADD CONSTRAINT horarios_entrenador_id_fkey
  FOREIGN KEY (entrenador_id) REFERENCES entrenadores(id_entrenador) ON DELETE SET NULL;

ALTER TABLE horarios DROP CONSTRAINT IF EXISTS horarios_dia_semana_turno_key;
ALTER TABLE horarios RENAME COLUMN turno TO nombre_turno;
ALTER TABLE horarios ADD CONSTRAINT horarios_dia_semana_nombre_turno_key UNIQUE (dia_semana, nombre_turno);

CREATE INDEX IF NOT EXISTS idx_horarios_entrenador ON horarios(entrenador_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia_semana ON horarios(dia_semana);

-- ------------------------------------------------------------
-- 8. alumno_horarios: alumno_id → alumnos · UNIQUE alumno+horario activo
-- ------------------------------------------------------------
ALTER TABLE alumno_horarios ADD COLUMN IF NOT EXISTS alumno_id_new INT;
UPDATE alumno_horarios ah
SET alumno_id_new = al.id_alumno
FROM alumnos al WHERE al.usuario_id = ah.alumno_id;
ALTER TABLE alumno_horarios DROP CONSTRAINT IF EXISTS alumno_horarios_alumno_id_fkey;
DROP INDEX IF EXISTS idx_ah_activo;
DROP INDEX IF EXISTS idx_ah_alumno;
ALTER TABLE alumno_horarios DROP COLUMN IF EXISTS alumno_id;
ALTER TABLE alumno_horarios RENAME COLUMN alumno_id_new TO alumno_id;
ALTER TABLE alumno_horarios ADD CONSTRAINT alumno_horarios_alumno_id_fkey
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno) ON DELETE RESTRICT;

-- Una sola fila activa por (alumno, horario): desactivar activas duplicadas que no sean la primera
UPDATE alumno_horarios ah
SET estado = 'inactivo'
WHERE estado = 'activo'
  AND EXISTS (SELECT 1 FROM alumno_horarios ah2
              WHERE ah2.alumno_id = ah.alumno_id AND ah2.horario_id = ah.horario_id
                AND ah2.estado = 'activo' AND ah2.id < ah.id);

CREATE UNIQUE INDEX idx_ah_activo ON alumno_horarios (alumno_id) WHERE estado = 'activo';
CREATE UNIQUE INDEX idx_ah_alumno_horario ON alumno_horarios (alumno_id, horario_id) WHERE estado = 'activo';
CREATE INDEX IF NOT EXISTS idx_ah_alumno ON alumno_horarios(alumno_id);
CREATE INDEX IF NOT EXISTS idx_ah_horario ON alumno_horarios(horario_id);

-- ------------------------------------------------------------
-- 9. asistencias: alumno_id → alumnos · UNIQUE (alumno, horario, fecha)
-- ------------------------------------------------------------
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS alumno_id_new INT;
UPDATE asistencias a
SET alumno_id_new = al.id_alumno
FROM alumnos al WHERE al.usuario_id = a.alumno_id;
ALTER TABLE asistencias DROP CONSTRAINT IF EXISTS asistencias_alumno_id_fkey;
ALTER TABLE asistencias DROP COLUMN IF EXISTS alumno_id;
ALTER TABLE asistencias RENAME COLUMN alumno_id_new TO alumno_id;
ALTER TABLE asistencias ADD CONSTRAINT asistencias_alumno_id_fkey
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno) ON DELETE RESTRICT;

-- Deduplicar registros idénticos (alumno, horario, fecha) antes del UNIQUE
DELETE FROM asistencias a
USING asistencias b
WHERE a.id_asistencia > b.id_asistencia
  AND a.alumno_id = b.alumno_id
  AND a.horario_id = b.horario_id
  AND a.fecha = b.fecha;

CREATE UNIQUE INDEX idx_asistencias_unica ON asistencias (alumno_id, horario_id, fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_alumno ON asistencias(alumno_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_horario ON asistencias(horario_id);

-- ------------------------------------------------------------
-- 10. progresos_alumnos → evaluaciones_progreso
--     alumno_id → alumnos · entrenador_id → entrenadores
-- ------------------------------------------------------------
ALTER TABLE progresos_alumnos RENAME TO evaluaciones_progreso;
ALTER TABLE evaluaciones_progreso RENAME CONSTRAINT progresos_alumnos_pkey TO evaluaciones_progreso_pkey;
ALTER TABLE evaluaciones_progreso DROP CONSTRAINT IF EXISTS progresos_alumnos_alumno_id_fkey;
ALTER TABLE evaluaciones_progreso DROP CONSTRAINT IF EXISTS progresos_alumnos_entrenador_id_fkey;

ALTER TABLE evaluaciones_progreso ADD COLUMN IF NOT EXISTS alumno_id_new INT;
UPDATE evaluaciones_progreso ep
SET alumno_id_new = al.id_alumno
FROM alumnos al WHERE al.usuario_id = ep.alumno_id;
ALTER TABLE evaluaciones_progreso DROP COLUMN IF EXISTS alumno_id;
ALTER TABLE evaluaciones_progreso RENAME COLUMN alumno_id_new TO alumno_id;
ALTER TABLE evaluaciones_progreso ADD CONSTRAINT evaluaciones_progreso_alumno_id_fkey
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno) ON DELETE RESTRICT;

ALTER TABLE evaluaciones_progreso ADD COLUMN IF NOT EXISTS entrenador_id_new INT;
UPDATE evaluaciones_progreso ep
SET entrenador_id_new = e.id_entrenador
FROM entrenadores e WHERE e.usuario_id = ep.entrenador_id;
ALTER TABLE evaluaciones_progreso DROP COLUMN IF EXISTS entrenador_id;
ALTER TABLE evaluaciones_progreso RENAME COLUMN entrenador_id_new TO entrenador_id;
ALTER TABLE evaluaciones_progreso ADD CONSTRAINT evaluaciones_progreso_entrenador_id_fkey
  FOREIGN KEY (entrenador_id) REFERENCES entrenadores(id_entrenador) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_eval_progreso_alumno ON evaluaciones_progreso(alumno_id);
CREATE INDEX IF NOT EXISTS idx_eval_progreso_entrenador ON evaluaciones_progreso(entrenador_id);
CREATE INDEX IF NOT EXISTS idx_eval_progreso_fecha ON evaluaciones_progreso(fecha_evaluacion);

-- ------------------------------------------------------------
-- 11. historial_niveles: alumno_id → alumnos
-- ------------------------------------------------------------
ALTER TABLE historial_niveles ADD COLUMN IF NOT EXISTS alumno_id_new INT;
UPDATE historial_niveles hn
SET alumno_id_new = al.id_alumno
FROM alumnos al WHERE al.usuario_id = hn.alumno_id;
ALTER TABLE historial_niveles DROP CONSTRAINT IF EXISTS historial_niveles_alumno_id_fkey;
ALTER TABLE historial_niveles DROP COLUMN IF EXISTS alumno_id;
ALTER TABLE historial_niveles RENAME COLUMN alumno_id_new TO alumno_id;
ALTER TABLE historial_niveles ADD CONSTRAINT historial_niveles_alumno_id_fkey
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno) ON DELETE RESTRICT;

-- ------------------------------------------------------------
-- 12. Conteos de verificación
-- ------------------------------------------------------------
SELECT 'roles' AS tabla, COUNT(*) FROM roles
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL SELECT 'alumnos', COUNT(*) FROM alumnos
UNION ALL SELECT 'entrenadores', COUNT(*) FROM entrenadores
UNION ALL SELECT 'empleados', COUNT(*) FROM empleados
UNION ALL SELECT 'membresias', COUNT(*) FROM membresias
UNION ALL SELECT 'pagos', COUNT(*) FROM pagos
UNION ALL SELECT 'horarios', COUNT(*) FROM horarios
UNION ALL SELECT 'alumno_horarios', COUNT(*) FROM alumno_horarios
UNION ALL SELECT 'asistencias', COUNT(*) FROM asistencias
UNION ALL SELECT 'evaluaciones_progreso', COUNT(*) FROM evaluaciones_progreso;

COMMIT;