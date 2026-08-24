-- Seed: Usuario Entrenador de prueba
-- Contraseña: hola123
INSERT INTO usuarios (nombre, correo, password, rol)
SELECT 'Entrenador', 'entrenador@invictus.com',
  '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
  'Entrenador'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = 'entrenador@invictus.com');
