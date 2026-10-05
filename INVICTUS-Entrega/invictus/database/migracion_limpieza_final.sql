-- ============================================================
--  MIGRACIÓN DE LIMPIEZA FINAL — Academia de Boxeo Invictus
--
--  Se ejecuta DESPUÉS de:
--    schema.sql   (o el esquema pre-normalización) +
--    migracion_normalizacion_v2.sql
--
--  Ya con el backend 100 % actualizado al esquema normalizado,
--  se eliminan las columnas legado que la aplicación ya no usa.
--
--  Se ELIMINAN:
--    usuarios.rol                  → roles.id_rol / usuarios.rol_id
--    usuarios.ci / fecha_nacimiento / celular / direccion
--                                  → viven en los perfiles
--                                    (alumnos / entrenadores / empleados)
--    alumno_horarios.turno         → turno vía horarios.nombre_turno
--    asistencias.entrenador_id     → entrenador derivado del horario
--
--  Se CONSERVAN (semántica activa en el código actual):
--    pagos.alumno_id               = id_usuario del alumno (se mantiene,
--                                    usado por el modelo Pago + FK a usuarios)
--    historial_niveles.usuario_id  = quién registró el cambio de nivel
--    bitacora_acciones.rol         = nombre del rol al momento del evento
--
--  TRANSACCIONAL · IDEMPOTENTE (DROP COLUMN IF EXISTS).
--  Respaldo recomendado antes de aplicar:
--    pg_dump -h localhost -U postgres -d invictus_boxeo -Fc
--      -f backups/backup_pre_limpieza.dump
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. usuarios: se quedan solo con identidad + acceso + rol_id
-- ------------------------------------------------------------
ALTER TABLE usuarios
  DROP COLUMN IF EXISTS rol,
  DROP COLUMN IF EXISTS ci,
  DROP COLUMN IF EXISTS fecha_nacimiento,
  DROP COLUMN IF EXISTS celular,
  DROP COLUMN IF EXISTS direccion;

DROP INDEX IF EXISTS idx_usuarios_ci;
DROP INDEX IF EXISTS idx_usuarios_celular;

-- ------------------------------------------------------------
-- 2. alumno_horarios: sin columna turno duplicada
-- ------------------------------------------------------------
ALTER TABLE alumno_horarios
  DROP COLUMN IF EXISTS turno;

-- ------------------------------------------------------------
-- 3. asistencias: sin entrenador asignado a mano (viene del horario)
-- ------------------------------------------------------------
ALTER TABLE asistencias
  DROP COLUMN IF EXISTS entrenador_id;

DROP INDEX IF EXISTS idx_asistencias_entrenador;

-- ------------------------------------------------------------
-- 4. Verificación post-limpieza
-- ------------------------------------------------------------
SELECT 'usuarios' AS tabla,
       string_agg(column_name, ', ' ORDER BY ordinal_position) AS columnas
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios'
GROUP BY table_name;

COMMIT;