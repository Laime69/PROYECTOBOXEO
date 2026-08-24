-- ============================================================
--  ESQUEMA NORMALIZADO — Academia de Boxeo Invictus
--  1FN/2FN/3FN:
--   - Cada entidad en su propia tabla (usuarios base + perfiles
--     específicos por rol en relación 1:1).
--   - Sin columnas duplicadas: horarios solo guarda
--     dia_semana y turno (dia/nombre_turno/dias se derivan).
--   - Sin datos redundantes: el estado de pago del alumno vive
--     en perfiles_alumnos, no en usuarios.
--   - Todas las relaciones con claves foráneas (FK).
--  Ejecutar sobre una base vacía (nombre sugerido: invictus_boxeo).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Usuarios: identidad + acceso + datos personales comunes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(30) NOT NULL DEFAULT 'Alumno'
    CHECK (rol IN ('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno')),
  ci VARCHAR(20) NOT NULL DEFAULT '',
  fecha_nacimiento DATE NOT NULL DEFAULT '2000-01-01',
  celular VARCHAR(20) NOT NULL DEFAULT '',
  direccion VARCHAR(255) NOT NULL DEFAULT '',
  estado VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo')),
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_ci ON usuarios(ci);
CREATE INDEX IF NOT EXISTS idx_usuarios_celular ON usuarios(celular);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);

-- ------------------------------------------------------------
-- 2. Perfil del alumno (relación 1:1 con usuarios)
--    Datos deportivos + datos de inscripción/pago.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfiles_alumnos (
  alumno_id INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  contacto_emergencia VARCHAR(100) DEFAULT '',
  celular_contacto_emergencia VARCHAR(20) DEFAULT '',
  nivel_deportivo VARCHAR(30) DEFAULT 'principiante',
  peso_actual DECIMAL(5,2) DEFAULT 0,
  objetivo_entrenamiento VARCHAR(255) DEFAULT '',
  observacion_medica TEXT DEFAULT '',
  fecha_inscripcion DATE,
  fecha_vencimiento DATE,
  estado_pago VARCHAR(20) DEFAULT 'pendiente'
    CHECK (estado_pago IN ('pendiente', 'pagado', 'vencido')),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfiles_alumnos_estado_pago ON perfiles_alumnos(estado_pago);
CREATE INDEX IF NOT EXISTS idx_perfiles_alumnos_nivel ON perfiles_alumnos(nivel_deportivo);

-- ------------------------------------------------------------
-- 3. Perfil del entrenador (relación 1:1 con usuarios)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfiles_entrenadores (
  entrenador_id INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  especialidad VARCHAR(100) DEFAULT '',
  experiencia_anios INTEGER DEFAULT 0,
  fecha_ingreso DATE,
  estado_laboral VARCHAR(20) DEFAULT 'activo',
  observaciones TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. Perfil del recepcionista (relación 1:1 con usuarios)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfiles_recepcionistas (
  recepcionista_id INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  turno_trabajo VARCHAR(10) DEFAULT '',
  area VARCHAR(50) DEFAULT 'recepcion',
  fecha_ingreso DATE,
  estado_laboral VARCHAR(20) DEFAULT 'activo',
  observaciones TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. Perfil del administrador / super admin (1:1 con usuarios)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfiles_administradores (
  administrador_id INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  cargo VARCHAR(100) DEFAULT '',
  celular_institucional VARCHAR(20) DEFAULT '',
  fecha_ingreso DATE,
  estado_laboral VARCHAR(20) DEFAULT 'activo',
  observaciones TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. Horarios: bloque de entrenamiento normalizado
--    La dupla (dia_semana, turno) es la clave natural.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios (
  id_horario SERIAL PRIMARY KEY,
  entrenador_id INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  dia_semana VARCHAR(15) NOT NULL
    CHECK (dia_semana IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes')),
  turno VARCHAR(10) NOT NULL
    CHECK (turno IN ('manana', 'tarde', 'noche')),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  clase VARCHAR(100) NOT NULL DEFAULT 'Boxeo',
  grupo VARCHAR(50),
  cupo_maximo INTEGER,
  tipo_actividad VARCHAR(20) NOT NULL DEFAULT 'entrenamiento'
    CHECK (tipo_actividad IN ('entrenamiento', 'sparring')),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (dia_semana, turno)
);

CREATE INDEX IF NOT EXISTS idx_horarios_entrenador ON horarios(entrenador_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia_semana ON horarios(dia_semana);

-- ------------------------------------------------------------
-- 7. Asistencias (relaciona alumno + entrenador + horario)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asistencias (
  id_asistencia SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  entrenador_id INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  horario_id INTEGER REFERENCES horarios(id_horario) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'presente'
    CHECK (estado IN ('presente', 'falta', 'permiso', 'tardanza', 'justificado')),
  tipo_actividad VARCHAR(20),
  observacion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_alumno ON asistencias(alumno_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_entrenador ON asistencias(entrenador_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_horario ON asistencias(horario_id);

-- ------------------------------------------------------------
-- 8. Pagos mensuales (relaciona alumno + registrado_por)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 9. Progresos / evaluaciones del alumno
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progresos_alumnos (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  entrenador_id INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
  nivel VARCHAR(30) NOT NULL DEFAULT 'basico',
  tecnica INTEGER CHECK (tecnica BETWEEN 1 AND 10),
  defensa INTEGER CHECK (defensa BETWEEN 1 AND 10),
  resistencia INTEGER CHECK (resistencia BETWEEN 1 AND 10),
  velocidad INTEGER CHECK (velocidad BETWEEN 1 AND 10),
  fuerza INTEGER CHECK (fuerza BETWEEN 1 AND 10),
  disciplina INTEGER CHECK (disciplina BETWEEN 1 AND 10),
  sparring INTEGER CHECK (sparring BETWEEN 1 AND 10),
  peso NUMERIC(5,2),
  observacion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_progreso_alumno ON progresos_alumnos(alumno_id);
CREATE INDEX IF NOT EXISTS idx_progreso_entrenador ON progresos_alumnos(entrenador_id);
CREATE INDEX IF NOT EXISTS idx_progreso_fecha ON progresos_alumnos(fecha_evaluacion);

-- ------------------------------------------------------------
-- 10. Asignación alumno → horario (tabla puente N:M)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alumno_horarios (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  horario_id INTEGER NOT NULL REFERENCES horarios(id_horario) ON DELETE CASCADE,
  turno VARCHAR(10)
    CHECK (turno IN ('manana', 'tarde', 'noche')),
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo')),
  observacion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ah_alumno ON alumno_horarios(alumno_id);
CREATE INDEX IF NOT EXISTS idx_ah_horario ON alumno_horarios(horario_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ah_activo ON alumno_horarios(alumno_id) WHERE estado = 'activo';

-- ------------------------------------------------------------
-- 11. Bitácora de acciones del sistema
-- ------------------------------------------------------------
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
