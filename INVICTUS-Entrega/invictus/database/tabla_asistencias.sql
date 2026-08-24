CREATE TABLE IF NOT EXISTS asistencias (
  id_asistencia SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  entrenador_id INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  horario_id INTEGER,
  fecha DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'presente'
    CHECK (estado IN ('presente', 'falta', 'permiso')),
  observacion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_alumno ON asistencias(alumno_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_entrenador ON asistencias(entrenador_id);
