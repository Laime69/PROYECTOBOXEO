-- ============================================================
--  SEED — Usuarios del sistema (todos los roles)
--  Academia de Boxeo Invictus
--
--  Contraseña de TODOS los usuarios: hola123
--  (hash bcrypt generado con coste 10; verificado contra el
--   middleware de login del backend)
--
--  Ejecutar DESPUÉS de schema.sql.
-- ============================================================

INSERT INTO usuarios (nombre, correo, password, rol, ci, celular, estado)
VALUES
  ('Súper Administrador', 'superadmin@invictus.com',
   '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
   'SuperAdmin', '7711122', '70000001', 'activo'),

  ('Administrador', 'admin@invictus.com',
   '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
   'Administrador', '6622111', '70000002', 'activo'),

  ('Recepción Invictus', 'recepcion@invictus.com',
   '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
   'Recepcionista', '5533110', '70000003', 'activo'),

  ('Carlos Quispe', 'entrenador1@invictus.com',
   '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
   'Entrenador', '4448899', '70000004', 'activo'),

  ('Luis Huanca', 'entrenador2@invictus.com',
   '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
   'Entrenador', '4457766', '70000005', 'activo')
ON CONFLICT (correo) DO NOTHING;

-- Perfiles específicos por rol (relación 1:1 con usuarios)
INSERT INTO perfiles_administradores (administrador_id, cargo, fecha_ingreso)
SELECT id_usuario, v.cargo, CURRENT_DATE - 400
FROM usuarios u
JOIN (VALUES
  ('superadmin@invictus.com', 'Súper Administrador General'),
  ('admin@invictus.com', 'Administrador Operativo')
) AS v(correo, cargo) ON v.correo = u.correo
ON CONFLICT (administrador_id) DO NOTHING;

INSERT INTO perfiles_recepcionistas (recepcionista_id, turno_trabajo, area, fecha_ingreso)
SELECT id_usuario, 'tarde', 'recepcion', CURRENT_DATE - 200
FROM usuarios WHERE correo = 'recepcion@invictus.com'
ON CONFLICT (recepcionista_id) DO NOTHING;

INSERT INTO perfiles_entrenadores (entrenador_id, especialidad, experiencia_anios, fecha_ingreso)
SELECT id_usuario, v.especialidad, v.experiencia_anios, CURRENT_DATE - 300
FROM usuarios u
JOIN (VALUES
  ('entrenador1@invictus.com', 'Boxeo amateur y técnica', 8),
  ('entrenador2@invictus.com', 'Boxeo profesional y sparring', 12)
) AS v(correo, especialidad, experiencia_anios) ON v.correo = u.correo
ON CONFLICT (entrenador_id) DO NOTHING;
