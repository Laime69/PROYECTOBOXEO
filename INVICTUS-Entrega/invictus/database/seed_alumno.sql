-- Seed: Usuario Alumno de prueba
-- Contraseña: hola123
INSERT INTO usuarios (nombre, correo, password, rol, fecha_inscripcion, fecha_vencimiento, estado_pago)
SELECT 'Alumno Deportista', 'alumno@invictus.com',
  '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
  'Alumno', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'pendiente'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = 'alumno@invictus.com');
