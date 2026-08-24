-- Migración: Ampliar roles del sistema
-- Ejecutar en la base de datos 'invictus_boxeo'

-- 1. Eliminar la constraint CHECK actual
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

-- 2. Agregar la nueva constraint con los roles ampliados
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno'));

-- 3. Actualizar el tamaño de la columna si es necesario (opcional, por si el VARCHAR(20) se queda corto)
ALTER TABLE usuarios ALTER COLUMN rol TYPE VARCHAR(30);
