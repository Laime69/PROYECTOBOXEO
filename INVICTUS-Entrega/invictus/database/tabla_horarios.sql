CREATE TABLE IF NOT EXISTS horarios (
  id_horario SERIAL PRIMARY KEY,
  entrenador_id INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  dia VARCHAR(15) NOT NULL
    CHECK (dia IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  clase VARCHAR(100) NOT NULL DEFAULT 'Boxeo',
  grupo VARCHAR(50),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_horarios_entrenador ON horarios(entrenador_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia ON horarios(dia);
