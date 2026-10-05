-- ============================================================
--  MIGRACIÓN 3FN ESTRICTO — Academia de Boxeo Invictus
--
--  Para bases YA existentes. Para instalar desde cero basta con
--  schema.sql + seed.sql + seed-demo.sql (ya corregidos).
--
--  Qué corrige:
--    1. bitacora_acciones.rol  (VARCHAR) -> rol_id (FK a roles)
--    2. pagos.alumno_id        (dependencia transitiva) -> se elimina
--    3. CHECK en asistencias.tipo_actividad
--    4. CHECK en horarios.hora_fin > hora_inicio
--    5. UNIQUE parcial en membresias (1 activa por alumno)
--    6. UNIQUE en alumno_horarios: se permite N horarios activos
--
--  ANTES de ejecutar: backup con pg_dump.
--    pg_dump -h localhost -U postgres -d invictus_boxeo \
--      -Fc -f database/backups/backup_pre_3fn_<timestamp>.dump
--
--  Es transaccional: si algo falla, no cambia nada.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 0. GATES: abortar si los datos no permiten la migración
-- ------------------------------------------------------------

-- 0.1 Todo pago debe tener un alumno alcanzable por su membresía.
DO $$
DECLARE huerfanos INTEGER;
BEGIN
  SELECT COUNT(*) INTO huerfanos
  FROM pagos p
  LEFT JOIN membresias m ON m.id_membresia = p.membresia_id
  LEFT JOIN alumnos al ON al.id_alumno = m.alumno_id
  WHERE al.id_alumno IS NULL;

  IF huerfanos > 0 THEN
    RAISE EXCEPTION
      'ABORTADO: % pago(s) sin alumno alcanzable por membresias. Revisa pagos huérfanos antes de migrar.', huerfanos;
  END IF;
END $$;

-- 0.2 No puede haber dos membresías activas del mismo alumno.
DO $$
DECLARE duplicados INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicados
  FROM (SELECT alumno_id FROM membresias
        WHERE estado = 'activa'
        GROUP BY alumno_id HAVING COUNT(*) > 1) d;

  IF duplicados > 0 THEN
    RAISE EXCEPTION
      'ABORTADO: % alumno(s) con más de una membresía activa. Resuélvelo antes de migrar.', duplicados;
  END IF;
END $$;

-- 0.3 Los horarios deben terminar después de empezar.
DO $$
DECLARE invalidos INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalidos
  FROM horarios WHERE hora_fin <= hora_inicio;

  IF invalidos > 0 THEN
    RAISE EXCEPTION
      'ABORTADO: % horario(s) con hora_fin <= hora_inicio. Corrige las horas antes de migrar.', invalidos;
  END IF;
END $$;

-- 0.4 tipo_actividad de asistencias debe ser un valor permitido.
DO $$
DECLARE invalidos INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalidos
  FROM asistencias
  WHERE tipo_actividad IS NOT NULL
    AND tipo_actividad NOT IN ('entrenamiento', 'sparring');

  IF invalidos > 0 THEN
    RAISE EXCEPTION
      'ABORTADO: % asistencia(s) con tipo_actividad fuera del catálogo. Normaliza esos valores primero.', invalidos;
  END IF;
END $$;

-- 0.5 Duplicados del par alumno/horario activos (nuevo índice único).
DO $$
DECLARE duplicados INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicados
  FROM (SELECT alumno_id, horario_id FROM alumno_horarios
        WHERE estado = 'activo'
        GROUP BY alumno_id, horario_id HAVING COUNT(*) > 1) d;

  IF duplicados > 0 THEN
    RAISE EXCEPTION
      'ABORTADO: % par(es) alumno/horario duplicados entre asignaciones activas.', duplicados;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 1. bitacora_acciones: texto del rol -> FK al catálogo
--    Los registros con un rol desconocido quedan con rol_id NULL
--    en vez de perder el resto de la auditoría.
-- ------------------------------------------------------------
ALTER TABLE bitacora_acciones
  ADD COLUMN IF NOT EXISTS rol_id INTEGER REFERENCES roles(id_rol) ON DELETE SET NULL;

UPDATE bitacora_acciones b
   SET rol_id = r.id_rol
  FROM roles r
 WHERE r.nombre = b.rol
   AND b.rol_id IS DISTINCT FROM r.id_rol;

ALTER TABLE bitacora_acciones DROP COLUMN IF EXISTS rol;

CREATE INDEX IF NOT EXISTS idx_bitacora_rol_id ON bitacora_acciones(rol_id);

-- ------------------------------------------------------------
-- 2. pagos: eliminar la dependencia transitiva alumno_id
--    El alumno se obtiene por pagos.membresia_id -> membresias.alumno_id
-- ------------------------------------------------------------
DROP INDEX IF EXISTS idx_pagos_alumno;
ALTER TABLE pagos DROP COLUMN IF EXISTS alumno_id;

-- ------------------------------------------------------------
-- 3. CHECK en asistencias.tipo_actividad (paridad con horarios)
-- ------------------------------------------------------------
ALTER TABLE asistencias DROP CONSTRAINT IF EXISTS asistencias_tipo_actividad_check;
ALTER TABLE asistencias
  ADD CONSTRAINT asistencias_tipo_actividad_check
  CHECK (tipo_actividad IS NULL OR tipo_actividad IN ('entrenamiento', 'sparring'));

-- ------------------------------------------------------------
-- 4. CHECK horarios: el bloque debe terminar después de empezar
-- ------------------------------------------------------------
ALTER TABLE horarios DROP CONSTRAINT IF EXISTS horarios_hora_fin_check;
ALTER TABLE horarios
  ADD CONSTRAINT horarios_hora_fin_check CHECK (hora_fin > hora_inicio);

-- ------------------------------------------------------------
-- 5. Una sola membresía activa por alumno
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_membresias_activa
  ON membresias(alumno_id) WHERE estado = 'activa';

-- ------------------------------------------------------------
-- 6. Un alumno puede estar en varios bloques a la vez.
--    Se retira el único por alumno; el de (alumno, horario) se mantiene.
-- ------------------------------------------------------------
DROP INDEX IF EXISTS idx_ah_activo;

COMMIT;

-- ------------------------------------------------------------
-- Verificación posterior
-- ------------------------------------------------------------
SELECT 'pagos sin alumno alcanzable' AS check,
       COUNT(*) AS resultado
  FROM pagos p
  LEFT JOIN membresias m ON m.id_membresia = p.membresia_id
  LEFT JOIN alumnos al ON al.id_alumno = m.alumno_id
 WHERE al.id_alumno IS NULL
UNION ALL
SELECT 'bitacora sin rol_id (esperado: solo roles desconocidos)', COUNT(*)
  FROM bitacora_acciones WHERE rol_id IS NULL
UNION ALL
SELECT 'alumnos con >1 membresia activa', COUNT(*)
  FROM (SELECT alumno_id FROM membresias WHERE estado='activa'
        GROUP BY alumno_id HAVING COUNT(*) > 1) d
UNION ALL
SELECT 'alumnos con >1 horario activo (permitido)', COUNT(*)
  FROM (SELECT alumno_id FROM alumno_horarios WHERE estado='activo'
        GROUP BY alumno_id HAVING COUNT(*) > 1) d;
