-- ============================================================
--  ESQUEMA NORMALIZADO — Academia de Boxeo Invictus
--  Objetivo declarado: 3FN estricto.
--
--  1FN: todos los valores son atómicos.
--  2FN: todas las PK son surrogate de una sola columna, luego no
--       puede haber dependencias parciales. La única clave
--       compuesta real (horarios.dia_semana, nombre_turno) tiene
--       todos sus atributos dependientes del par completo.
--  3FN: sin dependencias transitivas de atributos no clave. En
--       particular NO existe pagos.alumno_id (se deriva por
--       membresia_id) ni bitacora_acciones.rol (se deriva por
--       usuarios.rol_id): ambos se resolvieron por join.
--
--  - Cada entidad en su propia tabla: usuarios base + perfiles
--     específicos por rol en relación 1:1.
--  - rol de acceso = catálogo roles (FK rol_id); sin columna rol
--     duplicada en usuarios.
--  - Datos personales (ci/fecha_nacimiento/celular/direccion)
--     viven solo en el perfil de cada rol, no en usuarios.
--  - horarios: turno = horarios.nombre_turno (sin duplicados).
--  - entrenador de una asistencia se deriva del horario.
--  - Relaciones todas con claves foráneas (FK) y CHECKs.
--
--  Fuera de alcance (anomalías que la normalización no cubre):
--   - alumnos.estado_pago y alumnos.peso_actual son agregados
--     cacheados; se desincronizan y los repara
--     backend/scripts/reconciliar_pagos.js.
--   - evaluaciones_progreso.promedio_* son agregados calculados
--     sobre ~30 columnas de puntaje; requieren trigger o vista.
--
--  Ejecutar sobre una base vacía (nombre: invictus_boxeo).
--  Luego: seed.sql y opcional seed-demo.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. roles: catálogo de roles del sistema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id_rol      SERIAL PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE
    CHECK (nombre IN ('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno')),
  descripcion VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (nombre, descripcion) VALUES
  ('SuperAdmin',     'Super administrador con acceso total'),
  ('Administrador',  'Administrador del sistema'),
  ('Recepcionista',  'Recepcionista de la academia'),
  ('Entrenador',     'Entrenador deportivo'),
  ('Alumno',         'Alumno inscrito en la academia')
ON CONFLICT (nombre) DO NOTHING;

-- ------------------------------------------------------------
-- 2. usuarios: identidad + acceso
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario    SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  correo        VARCHAR(150) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  estado        VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo')),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  rol_id        INT NOT NULL REFERENCES roles(id_rol)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);

-- ------------------------------------------------------------
-- 3. alumnos: perfil deportivo + identidad (1:1 con usuarios)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alumnos (
  id_alumno       SERIAL PRIMARY KEY,
  usuario_id      INTEGER NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  ci              VARCHAR(20) DEFAULT '',
  fecha_nacimiento DATE,
  celular         VARCHAR(20) DEFAULT '',
  direccion       VARCHAR(255) DEFAULT '',
  contacto_emergencia           VARCHAR(100) DEFAULT '',
  celular_contacto_emergencia   VARCHAR(20) DEFAULT '',
  nivel_deportivo VARCHAR(30) DEFAULT 'principiante',
  peso_actual     DECIMAL(5,2) DEFAULT 0,
  objetivo_entrenamiento        VARCHAR(255) DEFAULT '',
  observacion_medica            TEXT DEFAULT '',
  fecha_inscripcion             DATE,
  fecha_vencimiento             DATE,
  estado_pago     VARCHAR(20) DEFAULT 'pendiente'
    CHECK (estado_pago IN ('pendiente', 'pagado', 'vencido')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alumnos_estado_pago ON alumnos(estado_pago);
CREATE INDEX IF NOT EXISTS idx_alumnos_nivel ON alumnos(nivel_deportivo);

-- ------------------------------------------------------------
-- 4. entrenadores: perfil deportivo-laboral (1:1 con usuarios)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entrenadores (
  id_entrenador   SERIAL PRIMARY KEY,
  usuario_id      INTEGER NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  ci              VARCHAR(20) DEFAULT '',
  fecha_nacimiento DATE,
  celular         VARCHAR(20) DEFAULT '',
  direccion       VARCHAR(255) DEFAULT '',
  especialidad    VARCHAR(100) DEFAULT '',
  experiencia_anios INTEGER DEFAULT 0,
  fecha_ingreso   DATE,
  estado_laboral  VARCHAR(20) DEFAULT 'activo',
  observaciones   TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. empleados: recepcionistas, administradores y super admins (1:1)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empleados (
  id_empleado         SERIAL PRIMARY KEY,
  usuario_id          INTEGER NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  ci                  VARCHAR(20) DEFAULT '',
  fecha_nacimiento    DATE,
  celular             VARCHAR(20) DEFAULT '',
  direccion           VARCHAR(255) DEFAULT '',
  cargo               VARCHAR(100) DEFAULT '',
  area                VARCHAR(50) DEFAULT 'recepcion',
  turno_trabajo       VARCHAR(20) DEFAULT '',
  celular_institucional VARCHAR(20) DEFAULT '',
  fecha_ingreso       DATE,
  estado_laboral      VARCHAR(20) DEFAULT 'activo',
  observaciones       TEXT DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. Perfiles históricos 1:1 (se conservan; el backend actual
--    usa empleados para administradores/recepcionistas)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfiles_administradores (
  administrador_id INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  cargo            VARCHAR(100) DEFAULT '',
  celular_institucional VARCHAR(20) DEFAULT '',
  fecha_ingreso    DATE,
  estado_laboral   VARCHAR(20) DEFAULT 'activo',
  observaciones    TEXT DEFAULT '',
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS perfiles_recepcionistas (
  recepcionista_id INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  turno_trabajo    VARCHAR(10) DEFAULT '',
  area             VARCHAR(50) DEFAULT 'recepcion',
  fecha_ingreso    DATE,
  estado_laboral   VARCHAR(20) DEFAULT 'activo',
  observaciones    TEXT DEFAULT '',
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. horarios: bloque de entrenamiento normalizado
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios (
  id_horario    SERIAL PRIMARY KEY,
  entrenador_id INTEGER REFERENCES entrenadores(id_entrenador) ON DELETE SET NULL,
  dia_semana    VARCHAR(15) NOT NULL
    CHECK (dia_semana IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes')),
  nombre_turno  VARCHAR(10) NOT NULL
    CHECK (nombre_turno IN ('manana', 'tarde', 'noche')),
  hora_inicio   TIME NOT NULL,
  hora_fin      TIME NOT NULL,
  CONSTRAINT horarios_hora_fin_check CHECK (hora_fin > hora_inicio),
  clase         VARCHAR(100) NOT NULL DEFAULT 'Boxeo',
  grupo         VARCHAR(50),
  cupo_maximo   INTEGER,
  tipo_actividad VARCHAR(20) NOT NULL DEFAULT 'entrenamiento'
    CHECK (tipo_actividad IN ('entrenamiento', 'sparring')),
  estado        VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo')),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE (dia_semana, nombre_turno)
);

CREATE INDEX IF NOT EXISTS idx_horarios_entrenador ON horarios(entrenador_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia_semana ON horarios(dia_semana);

-- ------------------------------------------------------------
-- 8. membresias: plan de pago (1 por alumno)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS membresias (
  id_membresia     SERIAL PRIMARY KEY,
  alumno_id        INT NOT NULL REFERENCES alumnos(id_alumno) ON DELETE RESTRICT,
  tipo_plan        VARCHAR(50) NOT NULL DEFAULT 'mensual',
  fecha_inicio     DATE NOT NULL,
  fecha_vencimiento DATE,
  monto            NUMERIC(10,2) NOT NULL DEFAULT 200.00,
  estado           VARCHAR(20) NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa', 'inactiva', 'vencida', 'suspendida')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un alumno no puede tener dos membresías activas a la vez.
-- Parcial: el historial (vencida/inactiva) no bloquea una renovación.
CREATE UNIQUE INDEX IF NOT EXISTS idx_membresias_activa ON membresias(alumno_id) WHERE estado = 'activa';
CREATE INDEX IF NOT EXISTS idx_membresias_alumno ON membresias(alumno_id);

-- ------------------------------------------------------------
-- 9. alumno_horarios: asignación alumno → bloque (N:M)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alumno_horarios (
  id          SERIAL PRIMARY KEY,
  alumno_id   INTEGER NOT NULL REFERENCES alumnos(id_alumno) ON DELETE RESTRICT,
  horario_id  INTEGER NOT NULL REFERENCES horarios(id_horario) ON DELETE CASCADE,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin   DATE,
  estado      VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo')),
  observacion TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Un alumno puede estar en varios bloques a la vez (p. ej. lunes y miércoles).
-- La unicidad solo evita duplicar exactamente el mismo par alumno/horario.
CREATE UNIQUE INDEX idx_ah_alumno_horario ON alumno_horarios (alumno_id, horario_id) WHERE estado = 'activo';
CREATE INDEX IF NOT EXISTS idx_ah_alumno ON alumno_horarios(alumno_id);
CREATE INDEX IF NOT EXISTS idx_ah_horario ON alumno_horarios(horario_id);

-- ------------------------------------------------------------
-- 10. asistencias: alumno + horario + fecha (entrenador = del horario)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asistencias (
  id_asistencia SERIAL PRIMARY KEY,
  alumno_id     INTEGER NOT NULL REFERENCES alumnos(id_alumno) ON DELETE RESTRICT,
  horario_id    INTEGER REFERENCES horarios(id_horario) ON DELETE SET NULL,
  fecha         DATE NOT NULL,
  estado        VARCHAR(20) NOT NULL DEFAULT 'presente'
    CHECK (estado IN ('presente', 'falta', 'permiso', 'tardanza', 'justificado')),
  tipo_actividad VARCHAR(20) DEFAULT 'entrenamiento',
  CONSTRAINT asistencias_tipo_actividad_check
    CHECK (tipo_actividad IS NULL OR tipo_actividad IN ('entrenamiento', 'sparring')),
  observacion   TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_asistencias_unica ON asistencias (alumno_id, horario_id, fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_alumno ON asistencias(alumno_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_horario ON asistencias(horario_id);

-- ------------------------------------------------------------
-- 11. pagos: mensualidad por membresía
--     3FN: NO se guarda alumno_id. Es una dependencia transitiva
--     (membresia_id -> membresias.alumno_id); se obtiene por join.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
  id_pago         SERIAL PRIMARY KEY,
  membresia_id    INTEGER NOT NULL REFERENCES membresias(id_membresia) ON DELETE RESTRICT,
  mes             INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio            INTEGER NOT NULL,
  monto           DECIMAL(10,2) NOT NULL DEFAULT 200.00,
  estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pagado', 'pendiente', 'vencido')),
  fecha_pago      DATE,
  fecha_vencimiento DATE,
  metodo_pago     VARCHAR(20) CHECK (metodo_pago IN ('efectivo', 'qr', 'transferencia', 'otro')),
  observacion     TEXT,
  registrado_por  INTEGER REFERENCES usuarios(id_usuario),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE (membresia_id, mes, anio)
);

CREATE INDEX IF NOT EXISTS idx_pagos_mes_anio ON pagos(mes, anio);
CREATE INDEX IF NOT EXISTS idx_pagos_membresia ON pagos(membresia_id);

-- ------------------------------------------------------------
-- 12. evaluaciones_progreso: evaluación deportiva del alumno
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluaciones_progreso (
  id               SERIAL PRIMARY KEY,
  alumno_id        INTEGER NOT NULL REFERENCES alumnos(id_alumno) ON DELETE RESTRICT,
  entrenador_id    INTEGER REFERENCES entrenadores(id_entrenador) ON DELETE SET NULL,
  fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
  nivel            VARCHAR(30) NOT NULL DEFAULT 'basico'
    CHECK (nivel IN ('inicial','basico','intermedio','avanzado','competitivo')),
  nivel_deportivo  VARCHAR(30) DEFAULT 'principiante'
    CHECK (nivel_deportivo IN ('principiante','intermedio','avanzado','competitivo')),
  tipo_evaluacion  VARCHAR(30) DEFAULT 'mensual'
    CHECK (tipo_evaluacion IN ('inicial','mensual','trimestral','especial','competencia')),
  categoria_peso   VARCHAR(30) DEFAULT '',
  peso             NUMERIC(5,2),
  peso_anterior    NUMERIC(5,2),

  -- Técnica ofensiva
  jab              INTEGER CHECK (jab IS NULL OR jab BETWEEN 1 AND 10),
  directo          INTEGER CHECK (directo IS NULL OR directo BETWEEN 1 AND 10),
  gancho           INTEGER CHECK (gancho IS NULL OR gancho BETWEEN 1 AND 10),
  uppercut         INTEGER CHECK (uppercut IS NULL OR uppercut BETWEEN 1 AND 10),
  combinaciones    INTEGER CHECK (combinaciones IS NULL OR combinaciones BETWEEN 1 AND 10),
  precision_golpes INTEGER CHECK (precision_golpes IS NULL OR precision_golpes BETWEEN 1 AND 10),

  -- Técnica defensiva
  guardia          INTEGER CHECK (guardia IS NULL OR guardia BETWEEN 1 AND 10),
  bloqueos         INTEGER CHECK (bloqueos IS NULL OR bloqueos BETWEEN 1 AND 10),
  esquives         INTEGER CHECK (esquives IS NULL OR esquives BETWEEN 1 AND 10),
  contragolpe      INTEGER CHECK (contragolpe IS NULL OR contragolpe BETWEEN 1 AND 10),
  evitar_golpes    INTEGER CHECK (evitar_golpes IS NULL OR evitar_golpes BETWEEN 1 AND 10),

  -- Desplazamiento
  juego_piernas    INTEGER CHECK (juego_piernas IS NULL OR juego_piernas BETWEEN 1 AND 10),
  equilibrio       INTEGER CHECK (equilibrio IS NULL OR equilibrio BETWEEN 1 AND 10),
  coordinacion     INTEGER CHECK (coordinacion IS NULL OR coordinacion BETWEEN 1 AND 10),
  manejo_ring      INTEGER CHECK (manejo_ring IS NULL OR manejo_ring BETWEEN 1 AND 10),
  control_distancia INTEGER CHECK (control_distancia IS NULL OR control_distancia BETWEEN 1 AND 10),

  -- Condición física
  resistencia      INTEGER CHECK (resistencia IS NULL OR resistencia BETWEEN 1 AND 10),
  velocidad        INTEGER CHECK (velocidad IS NULL OR velocidad BETWEEN 1 AND 10),
  fuerza           INTEGER CHECK (fuerza IS NULL OR fuerza BETWEEN 1 AND 10),
  agilidad         INTEGER CHECK (agilidad IS NULL OR agilidad BETWEEN 1 AND 10),
  recuperacion     INTEGER CHECK (recuperacion IS NULL OR recuperacion BETWEEN 1 AND 10),

  -- Sparring y táctica
  estrategia       INTEGER CHECK (estrategia IS NULL OR estrategia BETWEEN 1 AND 10),
  reaccion         INTEGER CHECK (reaccion IS NULL OR reaccion BETWEEN 1 AND 10),
  control_emocional INTEGER CHECK (control_emocional IS NULL OR control_emocional BETWEEN 1 AND 10),
  aplicacion_tecnicas INTEGER CHECK (aplicacion_tecnicas IS NULL OR aplicacion_tecnicas BETWEEN 1 AND 10),
  rendimiento_asaltos INTEGER CHECK (rendimiento_asaltos IS NULL OR rendimiento_asaltos BETWEEN 1 AND 10),

  -- Disciplina
  asistencia_eval  INTEGER CHECK (asistencia_eval IS NULL OR asistencia_eval BETWEEN 1 AND 10),
  puntualidad      INTEGER CHECK (puntualidad IS NULL OR puntualidad BETWEEN 1 AND 10),
  esfuerzo         INTEGER CHECK (esfuerzo IS NULL OR esfuerzo BETWEEN 1 AND 10),
  respeto          INTEGER CHECK (respeto IS NULL OR respeto BETWEEN 1 AND 10),
  cumplimiento_instrucciones INTEGER CHECK (cumplimiento_instrucciones IS NULL OR cumplimiento_instrucciones BETWEEN 1 AND 10),

  -- Promedios por área
  promedio_tecnica_ofensiva  NUMERIC(5,2),
  promedio_tecnica_defensiva NUMERIC(5,2),
  promedio_desplazamiento    NUMERIC(5,2),
  promedio_condicion_fisica  NUMERIC(5,2),
  promedio_sparring_tactica  NUMERIC(5,2),
  promedio_disciplina        NUMERIC(5,2),
  promedio_general           NUMERIC(5,2),
  porcentaje_progreso        NUMERIC(5,2),

  -- Comentarios
  fortalezas       TEXT DEFAULT '',
  aspectos_mejorar TEXT DEFAULT '',
  observacion      TEXT,
  recomendaciones  TEXT DEFAULT '',
  proximo_objetivo TEXT DEFAULT '',
  proxima_evaluacion DATE,

  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eval_progreso_alumno ON evaluaciones_progreso(alumno_id);
CREATE INDEX IF NOT EXISTS idx_eval_progreso_entrenador ON evaluaciones_progreso(entrenador_id);
CREATE INDEX IF NOT EXISTS idx_eval_progreso_fecha ON evaluaciones_progreso(fecha_evaluacion);

-- ------------------------------------------------------------
-- 13. historial_niveles: cambios de nivel deportivo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_niveles (
  id            SERIAL PRIMARY KEY,
  alumno_id     INTEGER NOT NULL REFERENCES alumnos(id_alumno) ON DELETE RESTRICT,
  nivel_anterior VARCHAR(30) NOT NULL,
  nivel_nuevo   VARCHAR(30) NOT NULL,
  fecha_cambio  TIMESTAMP DEFAULT NOW(),
  observacion   TEXT DEFAULT '',
  usuario_id    INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hn_alumno ON historial_niveles(alumno_id);
CREATE INDEX IF NOT EXISTS idx_hn_fecha ON historial_niveles(fecha_cambio DESC);

-- ------------------------------------------------------------
-- 14. bitacora_acciones: auditoría del sistema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bitacora_acciones (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  -- 3FN: el rol es FK al catálogo, no una copia del nombre en texto
  -- (usuario_id -> usuarios.rol_id -> roles.nombre).
  rol_id      INTEGER REFERENCES roles(id_rol) ON DELETE SET NULL,
  accion      VARCHAR(50) NOT NULL,
  modulo      VARCHAR(50) NOT NULL,
  descripcion TEXT,
  fecha_hora  TIMESTAMP DEFAULT NOW(),
  ip          VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora_acciones(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_usuario ON bitacora_acciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_rol_id ON bitacora_acciones(rol_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_modulo ON bitacora_acciones(modulo);