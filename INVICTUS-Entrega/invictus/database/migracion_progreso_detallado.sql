-- ============================================================
--  MIGRACIÓN: Progreso Detallado — Academia de Boxeo Invictus
--  Extiende progresos_alumnos con indicadores por área y
--  crea tabla historial_niveles para cambios de nivel.
--
--  Seguro para ejecutar múltiples veces (IF NOT EXISTS).
--  No borra datos existentes.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Nuevas columnas en progresos_alumnos
-- ------------------------------------------------------------
ALTER TABLE progresos_alumnos
  ADD COLUMN IF NOT EXISTS tipo_evaluacion VARCHAR(30) DEFAULT 'mensual'
    CHECK (tipo_evaluacion IN ('inicial','mensual','trimestral','especial','competencia')),
  ADD COLUMN IF NOT EXISTS categoria_peso VARCHAR(30) DEFAULT '',
  ADD COLUMN IF NOT EXISTS nivel_deportivo VARCHAR(30) DEFAULT 'basico',

  -- Técnica ofensiva
  ADD COLUMN IF NOT EXISTS jab INTEGER CHECK (jab IS NULL OR jab BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS directo INTEGER CHECK (directo IS NULL OR directo BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS gancho INTEGER CHECK (gancho IS NULL OR gancho BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS uppercut INTEGER CHECK (uppercut IS NULL OR uppercut BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS combinaciones INTEGER CHECK (combinaciones IS NULL OR combinaciones BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS precision_golpes INTEGER CHECK (precision_golpes IS NULL OR precision_golpes BETWEEN 1 AND 10),

  -- Técnica defensiva
  ADD COLUMN IF NOT EXISTS guardia INTEGER CHECK (guardia IS NULL OR guardia BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS bloqueos INTEGER CHECK (bloqueos IS NULL OR bloqueos BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS esquives INTEGER CHECK (esquives IS NULL OR esquives BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS contragolpe INTEGER CHECK (contragolpe IS NULL OR contragolpe BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS evitar_golpes INTEGER CHECK (evitar_golpes IS NULL OR evitar_golpes BETWEEN 1 AND 10),

  -- Desplazamiento
  ADD COLUMN IF NOT EXISTS juego_piernas INTEGER CHECK (juego_piernas IS NULL OR juego_piernas BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS equilibrio INTEGER CHECK (equilibrio IS NULL OR equilibrio BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS coordinacion INTEGER CHECK (coordinacion IS NULL OR coordinacion BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS manejo_ring INTEGER CHECK (manejo_ring IS NULL OR manejo_ring BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS control_distancia INTEGER CHECK (control_distancia IS NULL OR control_distancia BETWEEN 1 AND 10),

  -- Condición física (resistencia, velocidad, fuerza ya existen)
  ADD COLUMN IF NOT EXISTS agilidad INTEGER CHECK (agilidad IS NULL OR agilidad BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS recuperacion INTEGER CHECK (recuperacion IS NULL OR recuperacion BETWEEN 1 AND 10),

  -- Sparring y táctica
  ADD COLUMN IF NOT EXISTS estrategia INTEGER CHECK (estrategia IS NULL OR estrategia BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS reaccion INTEGER CHECK (reaccion IS NULL OR reaccion BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS control_emocional INTEGER CHECK (control_emocional IS NULL OR control_emocional BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS aplicacion_tecnicas INTEGER CHECK (aplicacion_tecnicas IS NULL OR aplicacion_tecnicas BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS rendimiento_asaltos INTEGER CHECK (rendimiento_asaltos IS NULL OR rendimiento_asaltos BETWEEN 1 AND 10),

  -- Disciplina (sub-indicadores)
  ADD COLUMN IF NOT EXISTS asistencia_eval INTEGER CHECK (asistencia_eval IS NULL OR asistencia_eval BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS puntualidad INTEGER CHECK (puntualidad IS NULL OR puntualidad BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS esfuerzo INTEGER CHECK (esfuerzo IS NULL OR esfuerzo BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS respeto INTEGER CHECK (respeto IS NULL OR respeto BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS cumplimiento_instrucciones INTEGER CHECK (cumplimiento_instrucciones IS NULL OR cumplimiento_instrucciones BETWEEN 1 AND 10),

  -- Promedios por área (calculados)
  ADD COLUMN IF NOT EXISTS promedio_tecnica_ofensiva NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS promedio_tecnica_defensiva NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS promedio_desplazamiento NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS promedio_condicion_fisica NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS promedio_sparring_tactica NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS promedio_disciplina NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS promedio_general NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS porcentaje_progreso NUMERIC(5,2),

  -- Campos adicionales de texto
  ADD COLUMN IF NOT EXISTS fortalezas TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS aspectos_mejorar TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS recomendaciones TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS proximo_objetivo TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS proxima_evaluacion DATE,
  ADD COLUMN IF NOT EXISTS peso_anterior NUMERIC(5,2);

-- ------------------------------------------------------------
-- 2. Tabla historial_niveles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_niveles (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  nivel_anterior VARCHAR(30) NOT NULL,
  nivel_nuevo VARCHAR(30) NOT NULL,
  fecha_cambio TIMESTAMP DEFAULT NOW(),
  observacion TEXT DEFAULT '',
  usuario_id INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hn_alumno ON historial_niveles(alumno_id);
CREATE INDEX IF NOT EXISTS idx_hn_fecha ON historial_niveles(fecha_cambio DESC);
