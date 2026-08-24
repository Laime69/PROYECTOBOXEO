-- ============================================================
--  SEED DEMO — Datos de demostración
--  Academia de Boxeo Invictus
--
--  Carga: horarios fijos (turnos), 10 alumnos con inscripciones,
--  pagos del mes y del mes anterior, asistencias de las últimas
--  dos semanas y evaluaciones de progreso deportivo.
--
--  Las fechas se generan en función de CURRENT_DATE, por lo que
--  los datos siempre lucen recientes sin importar cuándo se cargue.
--
--  Ejecutar DESPUÉS de schema.sql y seed.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Horarios fijos: lunes a viernes en tres turnos
--    Mañana 09:00–11:00 · Tarde 14:00–16:00 · Noche 19:00–21:00
--    Los viernes por la noche es jornada de SPARRING.
-- ------------------------------------------------------------
INSERT INTO horarios (entrenador_id, dia_semana, turno, hora_inicio, hora_fin, clase, cupo_maximo, tipo_actividad, estado)
SELECT e.id_usuario, v.dia, v.turno, v.inicio::time, v.fin::time,
       CASE WHEN v.turno = 'noche' AND v.dia = 'viernes' THEN 'Sparring' ELSE 'Boxeo' END,
       20,
       CASE WHEN v.turno = 'noche' AND v.dia = 'viernes' THEN 'sparring' ELSE 'entrenamiento' END,
       'activo'
FROM (VALUES
  ('lunes','manana','09:00','11:00'),
  ('lunes','tarde','14:00','16:00'),
  ('lunes','noche','19:00','21:00'),
  ('martes','manana','09:00','11:00'),
  ('martes','tarde','14:00','16:00'),
  ('martes','noche','19:00','21:00'),
  ('miercoles','manana','09:00','11:00'),
  ('miercoles','tarde','14:00','16:00'),
  ('miercoles','noche','19:00','21:00'),
  ('jueves','manana','09:00','11:00'),
  ('jueves','tarde','14:00','16:00'),
  ('jueves','noche','19:00','21:00'),
  ('viernes','manana','09:00','11:00'),
  ('viernes','tarde','14:00','16:00'),
  ('viernes','noche','19:00','21:00')
) AS v(dia, turno, inicio, fin)
JOIN usuarios e ON e.correo = (CASE WHEN (ASCII(v.dia) + ASCII(v.turno)) % 2 = 0
                                    THEN 'entrenador1@invictus.com'
                                    ELSE 'entrenador2@invictus.com' END)
ON CONFLICT (dia_semana, turno) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Alumnos de demostración (rol Alumno + perfil deportivo)
-- ------------------------------------------------------------
INSERT INTO usuarios (nombre, correo, password, rol, ci, celular, direccion)
VALUES
  ('María Mamani',   'alumno1@invictus.com', '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO', 'Alumno', '6611001', '70010001', 'Oruro - Ciudad'),
  ('Juan Torres',    'alumno2@invictus.com', '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO', 'Alumno', '6611002', '70010002', 'Oruro - Sur'),
  ('Rosa Condori',   'alumno3@invictus.com', '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO', 'Alumno', '6611003', '70010003', 'Oruro - Norte'),
  ('Diego Flores',   'alumno4@invictus.com', '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO', 'Alumno', '6611004', '70010004', 'Oruro - Centro'),
  ('Carla Vargas',   'alumno5@invictus.com', '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO', 'Alumno', '6611005', '70010005', 'Soracachi'),
  ('Pedro Chávez',   'alumno6@invictus.com', '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO', 'Alumno', '6611006', '70010006', 'Oruro - Oeste'),
  ('Lucía Ortiz',    'alumno7@invictus.com', '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO', 'Alumno', '6611007', '70010007', 'Oruro - Este'),
  ('Miguel Rojas',   'alumno8@invictus.com', '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO', 'Alumno', '6611008', '70010008', 'Toledo'),
  ('Andrea Limachi', 'alumno9@invictus.com', '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO', 'Alumno', '6611009', '70010009', 'Oruro - Sur'),
  ('Jhon Pérez',     'alumno10@invictus.com','$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO', 'Alumno', '6611010', '70010010', 'Challacollo')
ON CONFLICT (correo) DO NOTHING;

-- Perfil deportivo y de inscripción de cada alumno
-- Estados de pago: 5 pagado · 3 pendiente · 2 vencido
INSERT INTO perfiles_alumnos (
  alumno_id, contacto_emergencia, celular_contacto_emergencia,
  nivel_deportivo, peso_actual, objetivo_entrenamiento, observacion_medica,
  fecha_inscripcion, fecha_vencimiento, estado_pago)
SELECT
  u.id_usuario,
  'Familiar ' || SPLIT_PART(u.nombre, ' ', 1),
  '70120' || LPAD((ROW_NUMBER() OVER (ORDER BY u.id_usuario))::text, 3, '0'),
  (ARRAY['principiante','intermedio','avanzado'])[1 + (u.id_usuario % 3)],
  52 + (u.id_usuario % 25),
  (ARRAY['Competir amateur','Mejorar condición física','Aprender defensa personal'])[1 + (u.id_usuario % 3)],
  CASE WHEN u.id_usuario % 4 = 0 THEN 'Requiere control médico mensual' ELSE '' END,
  (DATE_TRUNC('month', CURRENT_DATE))::date,
  CASE WHEN u.id_usuario % 5 IN (0, 4)                       -- vencidos
         THEN (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '7 days')::date
       ELSE (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
  END,
  CASE WHEN u.id_usuario % 5 IN (0, 4) THEN 'vencido'
       WHEN u.id_usuario % 5 = 3            THEN 'pendiente'
       ELSE 'pagado' END
FROM usuarios u
WHERE u.rol = 'Alumno' AND u.correo LIKE 'alumno%@invictus.com'
ON CONFLICT (alumno_id) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Asignación alumno → turno (una asignación activa por alumno)
-- ------------------------------------------------------------
INSERT INTO alumno_horarios (alumno_id, horario_id, turno, fecha_inicio, estado)
SELECT DISTINCT
  u.id_usuario,
  h.id_horario,
  h.turno,
  DATE_TRUNC('month', CURRENT_DATE)::date,
  'activo'
FROM usuarios u
JOIN horarios h ON h.turno = (ARRAY['manana','tarde','noche'])[1 + (u.id_usuario % 3)]
               AND h.dia_semana = 'lunes'
WHERE u.rol = 'Alumno' AND u.correo LIKE 'alumno%@invictus.com'
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 4. Pagos: mes anterior (todo pagado, historial) y mes actual
--    según el estado de cada alumno (Bs 200 mensual)
-- ------------------------------------------------------------
INSERT INTO pagos (alumno_id, mes, anio, monto, estado, fecha_pago, fecha_vencimiento, metodo_pago, observacion, registrado_por)
SELECT
  p.alumno_id,
  EXTRACT(MONTH FROM m.primer_dia)::int,
  EXTRACT(YEAR FROM m.primer_dia)::int,
  200.00,
  'pagado',
  (m.primer_dia + INTERVAL '2 days')::date,
  (m.primer_dia + INTERVAL '1 month - 1 day')::date,
  (ARRAY['efectivo','qr','transferencia'])[1 + (p.alumno_id % 3)],
  'Mensualidad',
  r.id_usuario
FROM perfiles_alumnos p
JOIN LATERAL (
  SELECT (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::date AS primer_dia
) m ON TRUE
CROSS JOIN LATERAL (
  SELECT id_usuario FROM usuarios WHERE correo = 'recepcion@invictus.com' LIMIT 1
) r
ON CONFLICT (alumno_id, mes, anio) DO NOTHING;

INSERT INTO pagos (alumno_id, mes, anio, monto, estado, fecha_pago, fecha_vencimiento, metodo_pago, observacion, registrado_por)
SELECT
  p.alumno_id,
  EXTRACT(MONTH FROM CURRENT_DATE)::int,
  EXTRACT(YEAR FROM CURRENT_DATE)::int,
  200.00,
  p.estado_pago,
  CASE WHEN p.estado_pago = 'pagado'
       THEN (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '3 days')::date END,
  CASE WHEN p.estado_pago = 'vencido'
       THEN (CURRENT_DATE - INTERVAL '7 days')::date
       ELSE (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date END,
  CASE WHEN p.estado_pago = 'pagado'
       THEN (ARRAY['efectivo','qr','transferencia'])[1 + (p.alumno_id % 3)] END,
  'Mensualidad corriente',
  r.id_usuario
FROM perfiles_alumnos p
CROSS JOIN LATERAL (
  SELECT id_usuario FROM usuarios WHERE correo = 'recepcion@invictus.com' LIMIT 1
) r
ON CONFLICT (alumno_id, mes, anio) DO NOTHING;

-- ------------------------------------------------------------
-- 5. Asistencias de las últimas dos semanas (solo días hábiles),
--    vinculadas al turno asignado de cada alumno y al horario real
-- ------------------------------------------------------------
INSERT INTO asistencias (alumno_id, entrenador_id, horario_id, fecha, estado, tipo_actividad, observacion)
SELECT
  ah.alumno_id,
  h2.entrenador_id,
  h2.id_horario,
  d::date,
  CASE ((ah.alumno_id * 7 + EXTRACT(DAY FROM d)::int) % 11)
    WHEN 0 THEN 'falta'
    WHEN 1 THEN 'tardanza'
    WHEN 2 THEN 'permiso'
    ELSE 'presente' END,
  h2.tipo_actividad,
  NULL
FROM alumno_horarios ah
JOIN horarios h1 ON h1.id_horario = ah.horario_id          -- para conocer el turno del alumno
JOIN horarios h2 ON h2.turno = h1.turno                    -- clase real del mismo turno ese día
CROSS JOIN generate_series(
  DATE_TRUNC('day', CURRENT_DATE) - INTERVAL '13 days',
  DATE_TRUNC('day', CURRENT_DATE) - INTERVAL '1 day',
  INTERVAL '1 day'
) AS d
WHERE ah.estado = 'activo'
  AND EXTRACT(DOW FROM d) BETWEEN 1 AND 5                  -- lunes a viernes
  AND h2.dia_semana = CASE EXTRACT(DOW FROM d)::int
        WHEN 1 THEN 'lunes' WHEN 2 THEN 'martes' WHEN 3 THEN 'miercoles'
        WHEN 4 THEN 'jueves' WHEN 5 THEN 'viernes' END
  AND NOT EXISTS (
    SELECT 1 FROM asistencias x
    WHERE x.alumno_id = ah.alumno_id AND x.horario_id = h2.id_horario AND x.fecha = d::date
  );

-- ------------------------------------------------------------
-- 6. Progreso deportivo: dos evaluaciones por alumno
-- ------------------------------------------------------------
INSERT INTO progresos_alumnos (alumno_id, entrenador_id, fecha_evaluacion, nivel,
                               tecnica, defensa, resistencia, velocidad, fuerza, disciplina, sparring, peso, observacion)
SELECT
  ah.alumno_id,
  h.entrenador_id,
  (CURRENT_DATE - v.atraso_dias)::date,
  CASE WHEN ah.alumno_id % 3 = 0 THEN 'intermedio'
       WHEN ah.alumno_id % 3 = 1 THEN 'basico'
       ELSE 'intermedio' END,
  4 + (ah.alumno_id + v.atraso_dias / 30) % 6,   -- técnica
  4 + (ah.alumno_id * 2) % 6,                    -- defensa
  5 + (ah.alumno_id + v.atraso_dias / 45) % 5,   -- resistencia
  4 + (ah.alumno_id * 3) % 6,                    -- velocidad
  4 + (ah.alumno_id * 5) % 6,                    -- fuerza
  6 + ah.alumno_id % 4,                          -- disciplina
  3 + (ah.alumno_id + v.atraso_dias / 60) % 6,   -- sparring
  52 + (ah.alumno_id % 25) - v.atraso_dias / 90, -- peso (baja levemente)
  CASE WHEN v.atraso_dias > 30
       THEN 'Evaluación inicial: buen potencial, mejorar resistencia.'
       ELSE 'Buen avance técnico; mantener ritmo de entrenamiento.' END
FROM alumno_horarios ah
JOIN horarios h ON h.id_horario = ah.horario_id
CROSS JOIN (VALUES (40), (12)) AS v(atraso_dias)
WHERE ah.estado = 'activo';

-- ------------------------------------------------------------
-- 7. Bitácora: registros de ejemplo de auditoría
-- ------------------------------------------------------------
INSERT INTO bitacora_acciones (usuario_id, rol, accion, modulo, descripcion, ip)
SELECT u.id_usuario, u.rol, v.accion, v.modulo, v.descripcion, '::1'
FROM usuarios u
CROSS JOIN (VALUES
  ('LOGIN',      'Autenticación', 'Inicio de sesión exitoso desde la aplicación web'),
  ('CREATE',     'Pagos',         'Registro de pagos de demostración del mes corriente'),
  ('CONSULTA',   'Reportes',      'Consulta del resumen general de reportes')
) AS v(accion, modulo, descripcion)
WHERE u.correo = 'superadmin@invictus.com';
