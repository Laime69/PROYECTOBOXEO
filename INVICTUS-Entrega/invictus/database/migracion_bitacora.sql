-- Migración: Tabla de bitácora de acciones del sistema
-- Ejecutar en la base de datos invictus_boxeo

CREATE TABLE IF NOT EXISTS bitacora_acciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  rol VARCHAR(30),
  accion VARCHAR(50) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  descripcion TEXT,
  fecha_hora TIMESTAMP DEFAULT NOW(),
  ip VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora_acciones(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_usuario ON bitacora_acciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_modulo ON bitacora_acciones(modulo);
