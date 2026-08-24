-- Migración: Agregar campos de perfil a la tabla usuarios
-- Fecha: 2026-07-12
-- Descripción: Agrega CI, fecha_nacimiento, celular y dirección para completar el perfil de usuario

-- =====================================================
-- 1. Agregar columnas de perfil
-- =====================================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ci VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS celular VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);

-- =====================================================
-- 2. Agregar restricciones NOT NULL con valores por defecto
-- (para usuarios existentes que ya tienen datos)
-- =====================================================
-- Primero actualizar registros existentes con valores por defecto
UPDATE usuarios SET ci = '' WHERE ci IS NULL;
UPDATE usuarios SET fecha_nacimiento = '2000-01-01' WHERE fecha_nacimiento IS NULL;
UPDATE usuarios SET celular = '' WHERE celular IS NULL;
UPDATE usuarios SET direccion = '' WHERE direccion IS NULL;

-- Ahora agregar las restricciones NOT NULL
ALTER TABLE usuarios ALTER COLUMN ci SET NOT NULL;
ALTER TABLE usuarios ALTER COLUMN ci SET DEFAULT '';
ALTER TABLE usuarios ALTER COLUMN fecha_nacimiento SET NOT NULL;
ALTER TABLE usuarios ALTER COLUMN fecha_nacimiento SET DEFAULT '2000-01-01';
ALTER TABLE usuarios ALTER COLUMN celular SET NOT NULL;
ALTER TABLE usuarios ALTER COLUMN celular SET DEFAULT '';
ALTER TABLE usuarios ALTER COLUMN direccion SET NOT NULL;
ALTER TABLE usuarios ALTER COLUMN direccion SET DEFAULT '';

-- =====================================================
-- 3. Agregar índices para búsquedas frecuentes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_ci ON usuarios(ci);
CREATE INDEX IF NOT EXISTS idx_usuarios_celular ON usuarios(celular);

-- =====================================================
-- Mensaje de confirmación
-- =====================================================
SELECT 'Migración completada: Columnas ci, fecha_nacimiento, celular, direccion agregadas a usuarios' AS resultado;
