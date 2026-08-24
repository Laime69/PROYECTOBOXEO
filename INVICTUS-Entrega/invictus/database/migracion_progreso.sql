CREATE TABLE IF NOT EXISTS progresos_alumnos (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  entrenador_id INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
  nivel VARCHAR(30) NOT NULL DEFAULT 'basico',
  tecnica INTEGER CHECK (tecnica BETWEEN 1 AND 10),
  defensa INTEGER CHECK (defensa BETWEEN 1 AND 10),
  resistencia INTEGER CHECK (resistencia BETWEEN 1 AND 10),
  velocidad INTEGER CHECK (velocidad BETWEEN 1 AND 10),
  fuerza INTEGER CHECK (fuerza BETWEEN 1 AND 10),
  disciplina INTEGER CHECK (disciplina BETWEEN 1 AND 10),
  sparring INTEGER CHECK (sparring BETWEEN 1 AND 10),
  peso NUMERIC(5,2),
  observacion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_progreso_alumno ON progresos_alumnos(alumno_id);
CREATE INDEX IF NOT EXISTS idx_progreso_entrenador ON progresos_alumnos(entrenador_id);
CREATE INDEX IF NOT EXISTS idx_progreso_fecha ON progresos_alumnos(fecha_evaluacion);
