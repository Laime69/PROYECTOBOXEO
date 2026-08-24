-- Migración: Agregar campos específicos por rol a la tabla usuarios
-- Fecha: 2026-07-12
-- Descripción: Agrega campos de perfil específicos para cada rol del sistema

-- =====================================================
-- 1. Campo general para todos los roles
-- =====================================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'activo';

-- =====================================================
-- 2. Campos específicos para Alumno
-- =====================================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS contacto_emergencia VARCHAR(100) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS celular_contacto_emergencia VARCHAR(20) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nivel_deportivo VARCHAR(30) DEFAULT 'principiante';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS peso_actual DECIMAL(5,2) DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS objetivo_entrenamiento VARCHAR(255) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS observacion_medica TEXT DEFAULT '';

-- =====================================================
-- 3. Campos específicos para Entrenador
-- =====================================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS especialidad VARCHAR(100) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS experiencia_anios INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_ingreso DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS estado_laboral VARCHAR(20) DEFAULT 'activo';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS observaciones TEXT DEFAULT '';

-- =====================================================
-- 4. Campos específicos para Recepcionista
-- (usa los mismos campos laborales: fecha_ingreso, estado_laboral, observaciones)
-- Agregar turno_trabajo y area
-- =====================================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS turno_trabajo VARCHAR(10) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS area VARCHAR(50) DEFAULT 'recepcion';

-- =====================================================
-- 5. Campos específicos para Administrador
-- (usa los mismos campos laborales: fecha_ingreso, estado_laboral, observaciones)
-- Agregar cargo y celular_institucional
-- =====================================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cargo VARCHAR(100) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS celular_institucional VARCHAR(20) DEFAULT '';

-- =====================================================
-- 6. Índices para búsquedas frecuentes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_nivel_deportivo ON usuarios(nivel_deportivo);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado_laboral ON usuarios(estado_laboral);

-- =====================================================
-- Mensaje de confirmación
-- =====================================================
SELECT 'Migración completada: Campos específicos por rol agregados a usuarios' AS resultado;
