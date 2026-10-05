-- ============================================================
--  SEED — Usuarios del sistema (todos los roles) · NORMALIZADO
--  Academia de Boxeo Invictus
--
--  Contraseña de TODOS los usuarios: hola123
--  (hash bcrypt coste 10; verificado por el login del backend)
--
--  Ejecutar DESPUÉS de schema.sql.
--  Opcional: seed-demo.sql para datos de demostración.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Usuarios base (rol vía catálogo roles)
-- ------------------------------------------------------------
INSERT INTO usuarios (nombre, correo, password, rol_id, estado)
VALUES
  ('Súper Administrador', 'superadmin@invictus.com',
   '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
   (SELECT id_rol FROM roles WHERE nombre = 'SuperAdmin'), 'activo'),

  ('Administrador', 'admin@invictus.com',
   '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
   (SELECT id_rol FROM roles WHERE nombre = 'Administrador'), 'activo'),

  ('Recepción Invictus', 'recepcion@invictus.com',
   '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
   (SELECT id_rol FROM roles WHERE nombre = 'Recepcionista'), 'activo'),

  ('Carlos Quispe', 'entrenador1@invictus.com',
   '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
   (SELECT id_rol FROM roles WHERE nombre = 'Entrenador'), 'activo'),

  ('Luis Huanca', 'entrenador2@invictus.com',
   '$2b$10$j7hso94FgOtNHSlAAKCcpuPFjO.FDqZfP6vHpoii2gBnwRAVigWJO',
   (SELECT id_rol FROM roles WHERE nombre = 'Entrenador'), 'activo')
ON CONFLICT (correo) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Perfil empleados: super admin / admin / recepcionista
-- ------------------------------------------------------------
INSERT INTO empleados (usuario_id, ci, celular, cargo, area, turno_trabajo, fecha_ingreso)
SELECT id_usuario, v.ci, v.celular, v.cargo, v.area, COALESCE(v.turno, ''), v.fecha_ingreso
FROM usuarios u
JOIN (VALUES
  ('superadmin@invictus.com', '7711122', '70000001', 'Súper Administrador General', 'direccion',    '',        CURRENT_DATE - 400),
  ('admin@invictus.com',      '6622111', '70000002', 'Administrador Operativo',      'administracion', '', CURRENT_DATE - 400),
  ('recepcion@invictus.com',  '5533110', '70000003', 'Recepcionista',                'recepcion',       'tarde', CURRENT_DATE - 200)
) AS v(correo, ci, celular, cargo, area, turno, fecha_ingreso) ON v.correo = u.correo
ON CONFLICT (usuario_id) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Perfil entrenadores
-- ------------------------------------------------------------
INSERT INTO entrenadores (usuario_id, ci, celular, especialidad, experiencia_anios, fecha_ingreso)
SELECT id_usuario, v.ci, v.celular, v.especialidad, v.experiencia_anios, v.fecha_ingreso
FROM usuarios u
JOIN (VALUES
  ('entrenador1@invictus.com', '4448899', '70000004', 'Boxeo amateur y técnica', 8,  CURRENT_DATE - 300),
  ('entrenador2@invictus.com', '4457766', '70000005', 'Boxeo profesional y sparring', 12, CURRENT_DATE - 300)
) AS v(correo, ci, celular, especialidad, experiencia_anios, fecha_ingreso) ON v.correo = u.correo
ON CONFLICT (usuario_id) DO NOTHING;

-- ------------------------------------------------------------
-- 4. Perfiles históricos por rol (relación 1:1) — se conservan
-- ------------------------------------------------------------
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