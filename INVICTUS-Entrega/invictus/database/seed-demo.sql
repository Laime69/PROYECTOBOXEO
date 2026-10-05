-- ============================================================
--  SEED DEMO — Datos de demostración · NORMALIZADO
--  Academia de Boxeo Invictus
--
--  Carga: horarios fijos (turnos), 10 alumnos con inscripciones,
--  membresías, pagos del mes y del mes anterior, asistencias de
--  las últimas dos semanas y evaluaciones de progreso deportivo.
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
INSERT INTO horarios (entrenador_id, dia_semana, nombre_turno, hora_inicio, hora_fin, clase, cupo_maximo, tipo_actividad, estado)
SELECT et.id_entrenador, v.dia, v.turno, v.inicio::time, v.fin::time,
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
JOIN entrenadores et ON et.usuario_id = e.id_usuario
ON CONFLICT (dia_semana, nombre_turno) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Alumnos de demostración (rol Alumno + perfil deportivo)
-- ------------------------------------------------------------
INSERT INTO usuarios (nombre, correo, password, rol_id, estado)
SELECT v.nombre, v.correo, '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
       r.id_rol, 'activo'
FROM (VALUES
  ('María Mamani',   'alumno1@invictus.com',  '6611001', '70010001', 'Oruro - Ciudad'),
  ('Juan Torres',    'alumno2@invictus.com',  '6611002', '70010002', 'Oruro - Sur'),
  ('Rosa Condori',   'alumno3@invictus.com',  '6611003', '70010003', 'Oruro - Norte'),
  ('Diego Flores',   'alumno4@invictus.com',  '6611004', '70010004', 'Oruro - Centro'),
  ('Carla Vargas',   'alumno5@invictus.com',  '6611005', '70010005', 'Soracachi'),
  ('Pedro Chávez',   'alumno6@invictus.com',  '6611006', '70010006', 'Oruro - Oeste'),
  ('Lucía Ortiz',    'alumno7@invictus.com',  '6611007', '70010007', 'Oruro - Este'),
  ('Miguel Rojas',   'alumno8@invictus.com',  '6611008', '70010008', 'Toledo'),
  ('Andrea Limachi', 'alumno9@invictus.com',  '6611009', '70010009', 'Oruro - Sur'),
  ('Jhon Pérez',     'alumno10@invictus.com', '6611010', '70010010', 'Challacollo')
) AS v(nombre, correo, ci, celular, direccion)
JOIN roles r ON r.nombre = 'Alumno'
ON CONFLICT (correo) DO NOTHING;

-- Perfil deportivo y de inscripción de cada alumno
-- Estados de pago: 5 pagado · 3 pendiente · 2 vencido
INSERT INTO alumnos (
  usuario_id, ci, celular, direccion,
  contacto_emergencia, celular_contacto_emergencia,
  nivel_deportivo, peso_actual, objetivo_entrenamiento, observacion_medica,
  fecha_inscripcion, fecha_vencimiento, estado_pago)
SELECT
  u.id_usuario,
  v.ci, v.celular, v.direccion,
  'Familiar ' || SPLIT_PART(u.nombre, ' ', 1),
  '70120' || LPAD((ROW_NUMBER() OVER (ORDER BY u.id_usuario))::text, 3, '0'),
  (ARRAY['principiante','intermedio','avanzado'])[1 + (u.id_usuario % 3)],
  52 + (u.id_usuario % 25),
  (ARRAY['Competir amateur','Mejorar condición física','Aprender defensa personal'])[1 + (u.id_usuario % 3)],
  CASE WHEN u.id_usuario % 4 = 0 THEN 'Requiere control médico mensual' ELSE '' END,
  (DATE_TRUNC('month', CURRENT_DATE))::date,
  CASE WHEN u.id_usuario % 5 IN (0, 4)                       -- vencidos
         THEN (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::date
       ELSE (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
  END,
  CASE WHEN u.id_usuario % 5 IN (0, 4) THEN 'vencido'
       WHEN u.id_usuario % 5 = 3            THEN 'pendiente'
       ELSE 'pagado' END
FROM usuarios u
JOIN roles r ON r.id_rol = u.rol_id
JOIN (VALUES
  ('alumno1@invictus.com',  '6611001', '70010001', 'Oruro - Ciudad'),
  ('alumno2@invictus.com',  '6611002', '70010002', 'Oruro - Sur'),
  ('alumno3@invictus.com',  '6611003', '70010003', 'Oruro - Norte'),
  ('alumno4@invictus.com',  '6611004', '70010004', 'Oruro - Centro'),
  ('alumno5@invictus.com',  '6611005', '70010005', 'Soracachi'),
  ('alumno6@invictus.com',  '6611006', '70010006', 'Oruro - Oeste'),
  ('alumno7@invictus.com',  '6611007', '70010007', 'Oruro - Este'),
  ('alumno8@invictus.com',  '6611008', '70010008', 'Toledo'),
  ('alumno9@invictus.com',  '6611009', '70010009', 'Oruro - Sur'),
  ('alumno10@invictus.com', '6611010', '70010010', 'Challacollo')
) AS v(correo, ci, celular, direccion) ON v.correo = u.correo
WHERE r.nombre = 'Alumno'
ON CONFLICT (usuario_id) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Membresías (1 por alumno) + asignación alumno → turno
-- ------------------------------------------------------------
INSERT INTO membresias (alumno_id, tipo_plan, fecha_inicio, fecha_vencimiento, monto, estado)
SELECT al.id_alumno, 'mensual',
       (DATE_TRUNC('month', CURRENT_DATE))::date,
       CASE WHEN al.estado_pago = 'vencido'
            THEN (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::date
            ELSE (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date END,
       200.00,
       CASE WHEN al.estado_pago = 'vencido' THEN 'vencida' ELSE 'activa' END
FROM alumnos al
JOIN usuarios u ON u.id_usuario = al.usuario_id
WHERE u.correo LIKE 'alumno%@invictus.com'
  AND NOT EXISTS (SELECT 1 FROM membresias m WHERE m.alumno_id = al.id_alumno);

-- una asignación activa por alumno (turno según su id)
INSERT INTO alumno_horarios (alumno_id, horario_id, fecha_inicio, estado)
SELECT DISTINCT
  al.id_alumno,
  h.id_horario,
  DATE_TRUNC('month', CURRENT_DATE)::date,
  'activo'
FROM alumnos al
JOIN usuarios u ON u.id_usuario = al.usuario_id
JOIN horarios h ON h.nombre_turno = (ARRAY['manana','tarde','noche'])[1 + (u.id_usuario % 3)]
               AND h.dia_semana = 'lunes'
WHERE u.correo LIKE 'alumno%@invictus.com'
  AND NOT EXISTS (
    SELECT 1 FROM alumno_horarios a2
    WHERE a2.alumno_id = al.id_alumno AND a2.estado = 'activo'
  );

-- ------------------------------------------------------------
-- 4. Pagos: mes anterior (todo pagado, historial) y mes actual
--    según el estado de cada alumno (Bs 200 mensual)
-- ------------------------------------------------------------
INSERT INTO pagos (membresia_id, mes, anio, monto, estado, fecha_pago, fecha_vencimiento, metodo_pago, observacion, registrado_por)
SELECT
  m.id_membresia,
  EXTRACT(MONTH FROM mens.dia)::int,
  EXTRACT(YEAR FROM mens.dia)::int,
  200.00,
  'pagado',
  (mens.dia + INTERVAL '2 days')::date,
  (mens.dia + INTERVAL '1 month - 1 day')::date,
  (ARRAY['efectivo','qr','transferencia'])[1 + (al.id_alumno % 3)],
  'Mensualidad',
  (SELECT id_usuario FROM usuarios WHERE correo = 'recepcion@invictus.com' LIMIT 1)
FROM alumnos al
JOIN membresias m ON m.alumno_id = al.id_alumno
JOIN usuarios u ON u.id_usuario = al.usuario_id
CROSS JOIN LATERAL (
  SELECT (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::date AS dia
) mens
WHERE u.correo LIKE 'alumno%@invictus.com'
ON CONFLICT (membresia_id, mes, anio) DO NOTHING;

INSERT INTO pagos (membresia_id, mes, anio, monto, estado, fecha_pago, fecha_vencimiento, metodo_pago, observacion, registrado_por)
SELECT
  m.id_membresia,
  EXTRACT(MONTH FROM CURRENT_DATE)::int,
  EXTRACT(YEAR FROM CURRENT_DATE)::int,
  200.00,
  al.estado_pago,
  CASE WHEN al.estado_pago = 'pagado'
       THEN (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '3 days')::date END,
  CASE WHEN al.estado_pago = 'vencido'
       THEN (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::date
       ELSE (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date END,
  CASE WHEN al.estado_pago = 'pagado'
       THEN (ARRAY['efectivo','qr','transferencia'])[1 + (al.id_alumno % 3)] END,
  'Mensualidad corriente',
  (SELECT id_usuario FROM usuarios WHERE correo = 'recepcion@invictus.com' LIMIT 1)
FROM alumnos al
JOIN membresias m ON m.alumno_id = al.id_alumno
JOIN usuarios u ON u.id_usuario = al.usuario_id
WHERE u.correo LIKE 'alumno%@invictus.com'
ON CONFLICT (membresia_id, mes, anio) DO NOTHING;

-- ------------------------------------------------------------
-- 5. Asistencias de las últimas dos semanas (solo días hábiles),
--    vinculadas al turno asignado de cada alumno y al horario real
-- ------------------------------------------------------------
INSERT INTO asistencias (alumno_id, horario_id, fecha, estado, tipo_actividad, observacion)
SELECT
  ah.alumno_id,
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
JOIN horarios h2 ON h2.nombre_turno = h1.nombre_turno      -- clase real del mismo turno ese día
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
--    (indicadores por área 1-10, tipo, categoría, nivel deportivo)
-- ------------------------------------------------------------
INSERT INTO evaluaciones_progreso (
  alumno_id, entrenador_id, fecha_evaluacion, nivel, nivel_deportivo, tipo_evaluacion, categoria_peso, peso, peso_anterior,
  -- Técnica ofensiva
  jab, directo, gancho, uppercut, combinaciones, precision_golpes,
  -- Técnica defensiva
  guardia, bloqueos, esquives, contragolpe, evitar_golpes,
  -- Desplazamiento
  juego_piernas, equilibrio, coordinacion, manejo_ring, control_distancia,
  -- Condición física
  resistencia, velocidad, fuerza, agilidad, recuperacion,
  -- Sparring y táctica
  estrategia, reaccion, control_emocional, aplicacion_tecnicas, rendimiento_asaltos,
  -- Disciplina
  asistencia_eval, puntualidad, esfuerzo, respeto, cumplimiento_instrucciones,
  -- Promedios y porcentaje
  promedio_tecnica_ofensiva, promedio_tecnica_defensiva, promedio_desplazamiento,
  promedio_condicion_fisica, promedio_sparring_tactica, promedio_disciplina,
  promedio_general, porcentaje_progreso,
  fortalezas, aspectos_mejorar, observacion, recomendaciones, proximo_objetivo, proxima_evaluacion
)
SELECT
  al.id_alumno,
  h.entrenador_id,
  (CURRENT_DATE - v.atraso_dias)::date,
  CASE WHEN (al.id_alumno + v.atraso_dias / 30) % 3 = 0 THEN 'intermedio'
       WHEN (al.id_alumno + v.atraso_dias / 30) % 3 = 1 THEN 'basico'
       ELSE 'intermedio' END,
  pa.nivel_deportivo,
  CASE WHEN v.atraso_dias > 30 THEN 'inicial' ELSE 'mensual' END,
  CASE
    WHEN (52 + (al.id_alumno % 25) - v.atraso_dias / 90) <= 52 THEN 'Mosca'
    WHEN (52 + (al.id_alumno % 25) - v.atraso_dias / 90) <= 57 THEN 'Gallo'
    WHEN (52 + (al.id_alumno % 25) - v.atraso_dias / 90) <= 60 THEN 'Pluma'
    ELSE 'Ligero' END,
  52 + (al.id_alumno % 25) - v.atraso_dias / 90,  -- peso (baja levemente)
  53 + (al.id_alumno % 25) - v.atraso_dias / 90,  -- peso_anterior

  -- Técnica ofensiva
  4 + (al.id_alumno + v.atraso_dias / 30) % 6,
  4 + (al.id_alumno * 2 + v.atraso_dias / 30) % 6,
  4 + (al.id_alumno + v.atraso_dias / 60) % 6,
  4 + (al.id_alumno * 3 + v.atraso_dias / 30) % 5,
  3 + (al.id_alumno + v.atraso_dias / 45) % 6,
  4 + (al.id_alumno * 2) % 6,
  -- Técnica defensiva
  4 + (al.id_alumno * 2 + v.atraso_dias / 30) % 6,
  4 + (al.id_alumno + v.atraso_dias / 45) % 6,
  3 + (al.id_alumno * 3) % 6,
  3 + (al.id_alumno + v.atraso_dias / 60) % 6,
  4 + (al.id_alumno * 2) % 6,
  -- Desplazamiento
  4 + (al.id_alumno + v.atraso_dias / 30) % 6,
  5 + (al.id_alumno * 2) % 5,
  4 + (al.id_alumno * 3) % 6,
  3 + (al.id_alumno + v.atraso_dias / 60) % 6,
  4 + al.id_alumno % 6,
  -- Condición física
  5 + (al.id_alumno + v.atraso_dias / 45) % 5,
  4 + (al.id_alumno * 3) % 6,
  4 + (al.id_alumno * 5) % 6,
  4 + (al.id_alumno * 2 + v.atraso_dias / 45) % 6,
  4 + (al.id_alumno + v.atraso_dias / 60) % 6,
  -- Sparring y táctica
  4 + (al.id_alumno + v.atraso_dias / 60) % 6,
  4 + (al.id_alumno * 2) % 6,
  5 + al.id_alumno % 4,
  3 + (al.id_alumno + v.atraso_dias / 45) % 6,
  3 + (al.id_alumno * 3) % 6,
  -- Disciplina
  6 + al.id_alumno % 4,
  5 + al.id_alumno % 4,
  6 + al.id_alumno % 3,
  6 + al.id_alumno % 3,
  5 + al.id_alumno % 5,
  -- Promedios (aproximados a partir de los indicadores)
  (4 + (al.id_alumno + v.atraso_dias / 30) % 6
     + 4 + (al.id_alumno * 2 + v.atraso_dias / 30) % 6
     + 4 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + (al.id_alumno * 3 + v.atraso_dias / 30) % 5
     + 3 + (al.id_alumno + v.atraso_dias / 45) % 6
     + 4 + (al.id_alumno * 2) % 6) / 6.0,
  (4 + (al.id_alumno * 2 + v.atraso_dias / 30) % 6
     + 4 + (al.id_alumno + v.atraso_dias / 45) % 6
     + 3 + (al.id_alumno * 3) % 6
     + 3 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + (al.id_alumno * 2) % 6) / 5.0,
  (4 + (al.id_alumno + v.atraso_dias / 30) % 6
     + 5 + (al.id_alumno * 2) % 5
     + 4 + (al.id_alumno * 3) % 6
     + 3 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + al.id_alumno % 6) / 5.0,
  (5 + (al.id_alumno + v.atraso_dias / 45) % 5
     + 4 + (al.id_alumno * 3) % 6
     + 4 + (al.id_alumno * 5) % 6
     + 4 + (al.id_alumno * 2 + v.atraso_dias / 45) % 6
     + 4 + (al.id_alumno + v.atraso_dias / 60) % 6) / 5.0,
  (4 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + (al.id_alumno * 2) % 6
     + 5 + al.id_alumno % 4
     + 3 + (al.id_alumno + v.atraso_dias / 45) % 6
     + 3 + (al.id_alumno * 3) % 6) / 5.0,
  (6 + al.id_alumno % 4
     + 5 + al.id_alumno % 4
     + 6 + al.id_alumno % 3
     + 6 + al.id_alumno % 3
     + 5 + al.id_alumno % 5) / 5.0,
  ((4 + (al.id_alumno + v.atraso_dias / 30) % 6
     + 4 + (al.id_alumno * 2 + v.atraso_dias / 30) % 6
     + 4 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + (al.id_alumno * 3 + v.atraso_dias / 30) % 5
     + 3 + (al.id_alumno + v.atraso_dias / 45) % 6
     + 4 + (al.id_alumno * 2) % 6) / 6.0
     + (4 + (al.id_alumno * 2 + v.atraso_dias / 30) % 6
     + 4 + (al.id_alumno + v.atraso_dias / 45) % 6
     + 3 + (al.id_alumno * 3) % 6
     + 3 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + (al.id_alumno * 2) % 6) / 5.0
     + (4 + (al.id_alumno + v.atraso_dias / 30) % 6
     + 5 + (al.id_alumno * 2) % 5
     + 4 + (al.id_alumno * 3) % 6
     + 3 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + al.id_alumno % 6) / 5.0
     + (5 + (al.id_alumno + v.atraso_dias / 45) % 5
     + 4 + (al.id_alumno * 3) % 6
     + 4 + (al.id_alumno * 5) % 6
     + 4 + (al.id_alumno * 2 + v.atraso_dias / 45) % 6
     + 4 + (al.id_alumno + v.atraso_dias / 60) % 6) / 5.0
     + (4 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + (al.id_alumno * 2) % 6
     + 5 + al.id_alumno % 4
     + 3 + (al.id_alumno + v.atraso_dias / 45) % 6
     + 3 + (al.id_alumno * 3) % 6) / 5.0
     + (6 + al.id_alumno % 4
     + 5 + al.id_alumno % 4
     + 6 + al.id_alumno % 3
     + 6 + al.id_alumno % 3
     + 5 + al.id_alumno % 5) / 5.0) / 6.0,
  ROUND(((4 + (al.id_alumno + v.atraso_dias / 30) % 6
     + 4 + (al.id_alumno * 2 + v.atraso_dias / 30) % 6
     + 4 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + (al.id_alumno * 3 + v.atraso_dias / 30) % 5
     + 3 + (al.id_alumno + v.atraso_dias / 45) % 6
     + 4 + (al.id_alumno * 2) % 6) / 6.0
     + (4 + (al.id_alumno * 2 + v.atraso_dias / 30) % 6
     + 4 + (al.id_alumno + v.atraso_dias / 45) % 6
     + 3 + (al.id_alumno * 3) % 6
     + 3 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + (al.id_alumno * 2) % 6) / 5.0
     + (4 + (al.id_alumno + v.atraso_dias / 30) % 6
     + 5 + (al.id_alumno * 2) % 5
     + 4 + (al.id_alumno * 3) % 6
     + 3 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + al.id_alumno % 6) / 5.0
     + (5 + (al.id_alumno + v.atraso_dias / 45) % 5
     + 4 + (al.id_alumno * 3) % 6
     + 4 + (al.id_alumno * 5) % 6
     + 4 + (al.id_alumno * 2 + v.atraso_dias / 45) % 6
     + 4 + (al.id_alumno + v.atraso_dias / 60) % 6) / 5.0
     + (4 + (al.id_alumno + v.atraso_dias / 60) % 6
     + 4 + (al.id_alumno * 2) % 6
     + 5 + al.id_alumno % 4
     + 3 + (al.id_alumno + v.atraso_dias / 45) % 6
     + 3 + (al.id_alumno * 3) % 6) / 5.0
     + (6 + al.id_alumno % 4
     + 5 + al.id_alumno % 4
     + 6 + al.id_alumno % 3
     + 6 + al.id_alumno % 3
     + 5 + al.id_alumno % 5) / 5.0) / 6.0 * 10, 2),
  'Técnica ofensiva sólida, buen control de distancia y mentalidad competitiva.',
  'Mejorar juego de piernas y porcentaje de contragolpe en situaciones de presión.',
  CASE WHEN v.atraso_dias > 30
       THEN 'Evaluación inicial: buen potencial, mejorar resistencia.'
       ELSE 'Buen avance técnico; mantener ritmo de entrenamiento.' END,
  'Seguir con trabajo de sombra y sparring controlado dos veces por semana.',
  'Mantener la constancia y alcanzar +0.5 en el promedio general para la próxima evaluación.',
  (CURRENT_DATE + 30)::date
FROM alumno_horarios ah
JOIN horarios h ON h.id_horario = ah.horario_id
JOIN alumnos al ON al.id_alumno = ah.alumno_id
JOIN usuarios u ON u.id_usuario = al.usuario_id
JOIN alumnos pa ON pa.id_alumno = ah.alumno_id
CROSS JOIN (VALUES (40), (12)) AS v(atraso_dias)
WHERE ah.estado = 'activo';

-- ------------------------------------------------------------
-- 7. Bitácora: registros de ejemplo de auditoría
-- ------------------------------------------------------------
INSERT INTO bitacora_acciones (usuario_id, rol_id, accion, modulo, descripcion, ip)
SELECT u.id_usuario, r.id_rol, v.accion, v.modulo, v.descripcion, '::1'
FROM usuarios u
JOIN roles r ON r.id_rol = u.rol_id
CROSS JOIN (VALUES
  ('LOGIN',      'Autenticación', 'Inicio de sesión exitoso desde la aplicación web'),
  ('CREATE',     'Pagos',         'Registro de pagos de demostración del mes corriente'),
  ('CONSULTA',   'Reportes',      'Consulta del resumen general de reportes')
) AS v(accion, modulo, descripcion)
WHERE u.correo = 'superadmin@invictus.com';