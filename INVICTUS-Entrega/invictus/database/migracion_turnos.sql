-- Migración: Agregar turnos a horarios y crear asignación alumno→horario

-- 1. Agregar columnas a horarios
ALTER TABLE horarios ADD COLUMN IF NOT EXISTS nombre_turno VARCHAR(50);
ALTER TABLE horarios ADD COLUMN IF NOT EXISTS dias VARCHAR(150);
ALTER TABLE horarios ADD COLUMN IF NOT EXISTS cupo_maximo INTEGER;

-- 2. Asignar nombre_turno a horarios existentes según hora
UPDATE horarios SET nombre_turno = 'Mañana' WHERE hora_inicio < '12:00' AND nombre_turno IS NULL;
UPDATE horarios SET nombre_turno = 'Tarde' WHERE hora_inicio >= '12:00' AND hora_inicio < '17:00' AND nombre_turno IS NULL;
UPDATE horarios SET nombre_turno = 'Noche' WHERE hora_inicio >= '17:00' AND nombre_turno IS NULL;

-- 3. Copiar dia → dias para registros existentes
UPDATE horarios SET dias = dia WHERE dias IS NULL;

-- 4. Crear tabla alumno_horarios
CREATE TABLE IF NOT EXISTS alumno_horarios (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  horario_id INTEGER NOT NULL REFERENCES horarios(id_horario) ON DELETE CASCADE,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo')),
  observacion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ah_alumno ON alumno_horarios(alumno_id);
CREATE INDEX IF NOT EXISTS idx_ah_horario ON alumno_horarios(horario_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ah_activo ON alumno_horarios(alumno_id) WHERE estado = 'activo';
