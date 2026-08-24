-- Migración: Turnos fijos (Mañana, Tarde, Noche) + Sparring viernes
-- No elimina datos existentes

-- 1. Agregar columnas nuevas a horarios
ALTER TABLE horarios ADD COLUMN IF NOT EXISTS dia_semana VARCHAR(15);
ALTER TABLE horarios ADD COLUMN IF NOT EXISTS turno VARCHAR(10);
ALTER TABLE horarios ADD COLUMN IF NOT EXISTS tipo_actividad VARCHAR(20) DEFAULT 'entrenamiento';

-- 2. Agregar columna a asistencias
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS tipo_actividad VARCHAR(20);

-- 3. Agregar columna turno a alumno_horarios (para asignación por turno)
ALTER TABLE alumno_horarios ADD COLUMN IF NOT EXISTS turno VARCHAR(10);

-- 4. Crear los 15 bloques fijos si no existen
-- Usamos dia_semana+turno como identificador único
DO $$
DECLARE
  dias TEXT[] := ARRAY['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  turnos_nombre TEXT[] := ARRAY['manana', 'tarde', 'noche'];
  turnos_hora_inicio TIME[] := ARRAY['09:00'::TIME, '14:00'::TIME, '19:00'::TIME];
  turnos_hora_fin TIME[] := ARRAY['11:00'::TIME, '16:00'::TIME, '21:00'::TIME];
  d TEXT;
  t TEXT;
  idx INT;
  dia_capitalizado VARCHAR(15);
  v_actividad VARCHAR(20);
BEGIN
  FOREACH d IN ARRAY dias
  LOOP
    idx := 1;
    FOREACH t IN ARRAY turnos_nombre
    LOOP
      -- Capitalizar día para el campo 'dia' legacy
      dia_capitalizado := INITCAP(d);
      IF d = 'miercoles' THEN dia_capitalizado := 'Miércoles'; END IF;

      -- Determinar tipo de actividad
      IF d = 'viernes' THEN
        v_actividad := 'sparring';
      ELSE
        v_actividad := 'entrenamiento';
      END IF;

      -- Insertar si no existe un registro con ese día + turno
      IF NOT EXISTS (
        SELECT 1 FROM horarios
        WHERE (dia_semana = d OR LOWER(dia) = LOWER(dia_capitalizado))
          AND (turno = t OR LOWER(nombre_turno) = LOWER(
            CASE t
              WHEN 'manana' THEN 'Mañana'
              WHEN 'tarde' THEN 'Tarde'
              WHEN 'noche' THEN 'Noche'
            END
          ))
      ) THEN
        INSERT INTO horarios (
          dia, dia_semana, turno, hora_inicio, hora_fin,
          clase, grupo, estado, nombre_turno, tipo_actividad, cupo_maximo, dias
        ) VALUES (
          dia_capitalizado,
          d,
          t,
          turnos_hora_inicio[idx],
          turnos_hora_fin[idx],
          'Boxeo',
          NULL,
          'activo',
          CASE t
            WHEN 'manana' THEN 'Mañana'
            WHEN 'tarde' THEN 'Tarde'
            WHEN 'noche' THEN 'Noche'
          END,
          v_actividad,
          NULL,
          'Lunes, Martes, Miércoles, Jueves, Viernes'
        );
      ELSE
        -- Actualizar dia_semana y turno si están NULL
        UPDATE horarios
        SET dia_semana = COALESCE(dia_semana, d),
            turno = COALESCE(turno, t),
            tipo_actividad = CASE WHEN d = 'viernes' THEN 'sparring' ELSE 'entrenamiento' END
        WHERE (dia_semana IS NULL OR turno IS NULL)
          AND (dia_semana = d OR LOWER(dia) = LOWER(dia_capitalizado))
          AND (turno = t OR LOWER(nombre_turno) = LOWER(
            CASE t
              WHEN 'manana' THEN 'Mañana'
              WHEN 'tarde' THEN 'Tarde'
              WHEN 'noche' THEN 'Noche'
            END
          ));
      END IF;

      idx := idx + 1;
    END LOOP;
  END LOOP;
END $$;

-- 5. Actualizar tipo_actividad para todos los viernes existentes
UPDATE horarios
SET tipo_actividad = 'sparring'
WHERE dia_semana = 'viernes' OR LOWER(dia) LIKE '%viernes%';
