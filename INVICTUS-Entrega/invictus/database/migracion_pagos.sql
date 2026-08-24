-- Migración: Tabla de historial de pagos por mes
-- No elimina datos existentes
-- No modifica la tabla usuarios (solo lectura)

CREATE TABLE IF NOT EXISTS pagos (
  id_pago SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio INTEGER NOT NULL,
  monto DECIMAL(10,2) NOT NULL DEFAULT 200.00,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pagado', 'pendiente', 'vencido')),
  fecha_pago DATE,
  fecha_vencimiento DATE,
  metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('efectivo', 'qr', 'transferencia', 'otro')),
  observacion TEXT,
  registrado_por INTEGER REFERENCES usuarios(id_usuario),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (alumno_id, mes, anio)
);

CREATE INDEX IF NOT EXISTS idx_pagos_alumno ON pagos(alumno_id);
CREATE INDEX IF NOT EXISTS idx_pagos_mes_anio ON pagos(mes, anio);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);
