# INVICTUS — Guía de Instalación y Ejecución

Sistema web Full Stack para la gestión integral de la **Academia de Boxeo
INVICTUS**: usuarios, alumnos, entrenadores, pagos, horarios, asistencias,
progreso deportivo, reportes, bitácora y portal del alumno.

Esta guía explica, paso a paso, cómo instalar el sistema, levantar el servicio y
cargar la base de datos con datos de demostración. Hay **dos caminos**:

- **A) Docker Compose** — recomendado para la entrega/defensa. Un solo comando,
  carga la base de datos y los datos automáticamente.
- **B) Instalación local** — recomendado para desarrollo (recarga en caliente).

---

## 1. Arquitectura y stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 · Vite 5 · React Router 6 · Axios · Tailwind CSS |
| Backend | Node.js (Express.js) · JWT · Bcrypt · pg (PostgreSQL) |
| Base de datos | PostgreSQL 16 (esquema normalizado en 3FN) |
| Infraestructura | Docker Compose (db + backend + frontend/nginx) |

La base de datos **no se autogenera** desde el código: el esquema se crea con
los scripts SQL de la carpeta `database/`.

Módulos implementados: autenticación con roles (Súper Administrador,
Administrador, Recepción/Cajero, Entrenador y Alumno), dashboard por rol,
gestión de usuarios/alumnos/entrenadores, pagos mensuales, horarios fijos por
turno, planilla de asistencias, progreso deportivo, reportes, perfiles y
bitácora de auditoría.

---

## 2. Requisitos previos

### Para el camino A (Docker) — el más simple
- **Docker Desktop** (incluye Docker Compose). Nada más.

### Para el camino B (local)
- **Node.js 18 o superior** y **npm 9+**.
- **PostgreSQL 16** instalado y en ejecución en el puerto `5432`.

> Nota importante: el paquete **no incluye las carpetas `node_modules`** (pesan
> cientos de MB y dependen del sistema operativo). Se instalan con `npm install`,
> como se indica abajo. Con Docker no hace falta instalarlas: se compilan dentro
> de los contenedores.

---

## 3. Camino A — Docker Compose (recomendado para la entrega)

Desde la carpeta del proyecto (`invictus/`, donde está `docker-compose.yml`):

```bash
docker compose up --build -d
```

Esto levanta tres contenedores y, la **primera vez**, la base de datos ejecuta
automáticamente y en orden:

1. `database/schema.sql` — esquema normalizado en 3FN estricto (15 tablas).
2. `database/seed.sql` — usuarios de todos los roles y sus perfiles.
3. `database/seed-demo.sql` — horarios fijos, 10 alumnos, pagos,
   asistencias de las últimas dos semanas y evaluaciones de progreso.

Cuando termine, las URLs son:

| Servicio | URL |
|----------|-----|
| Aplicación (frontend) | http://localhost:8080/ |
| API (backend, vía proxy nginx) | http://localhost:8080/api |

Inicie sesión con cualquiera de las credenciales de la sección 5.

### 3.1 Detener / reiniciar

```bash
docker compose down           # detener (conserva los datos)
docker compose down -v        # detener y BORRAR la base de datos (arranque limpio)
docker compose up --build -d  # volver a levantar
```

---

## 4. Camino B — Instalación local (recomendado para desarrollo)

### 4.1 Base de datos

Con PostgreSQL en ejecución en `localhost:5432` (usuario `postgres`):

```bash
# Desde la carpeta invictus/
createdb -h localhost -U postgres invictus_boxeo                 # crear la base
psql -h localhost -U postgres -d invictus_boxeo -f database/schema.sql     # esquema
psql -h localhost -U postgres -d invictus_boxeo -f database/seed.sql       # usuarios
psql -h localhost -U postgres -d invictus_boxeo -f database/seed-demo.sql  # datos demo
```

> Si `createdb` no está disponible, use:
> `psql -h localhost -U postgres -c "CREATE DATABASE invictus_boxeo;"`

### 4.1.1 Base ya existente (actualizar a 3FN estricto)

Si ya tiene una base con el esquema anterior, **no** vuelva a correr
`schema.sql` sobre ella. En su lugar haga un backup y aplique la migración:

```bash
# 1. Backup obligatorio
pg_dump -h localhost -U postgres -d invictus_boxeo -Fc \
  -f database/backups/backup_pre_3fn_$(date +%Y%m%d_%H%M%S).dump

# 2. Migración (transaccional: si algo falla, no cambia nada)
psql -h localhost -U postgres -d invictus_boxeo -v ON_ERROR_STOP=1 \
  -f database/migracion_3fn_estricta.sql
```

La migración valida los datos **antes** de tocar nada y se aborta sola con un
mensaje claro si encuentra pagos huérfanos, membresías duplicadas, horarios
imposibles o `tipo_actividad` fuera del catálogo. Al final imprime una tabla
de verificación. Corrige lo que indique y vuelve a ejecutarla.

Qué cambia respecto a la versión anterior:

| Cambio | Detalle |
|--------|---------|
| `pagos.alumno_id` | **Se elimina** (dependencia transitiva de `membresia_id`). Se obtiene por join. |
| `bitacora_acciones.rol` | Texto → `rol_id` con FK a `roles`. |
| `alumno_horarios` | Un alumno puede estar en **varios** bloques a la vez. Antes solo uno. |
| `membresias` | Un alumno no puede tener dos membresías `activa` simultáneas. |
| `asistencias.tipo_actividad` | Nuevo `CHECK` contra el catálogo. |
| `horarios` | Nuevo `CHECK`: `hora_fin > hora_inicio`. |

> Los archivos `migracion_*.sql` anteriores a `migracion_3fn_estricta.sql`
> son históricos y **no** deben ejecutarse: referencian tablas y columnas
> que ya no existen (`usuarios.rol`, `perfiles_alumnos`, `progresos_alumnos`).
> Por la misma razón `backend/scripts/normalizar_schema.js` ya cumplió su
> función — fue lo que construyó el esquema actual — y no debe re-ejecutarse.

### 4.1.2 Verificar la instalación

Con el backend corriendo (sección 4.2) puede comprobar que todo responde:

```bash
cd backend
node smoke-test.js
```

Ejecuta 30 comprobaciones sobre la API: autenticación, pagos, bitácora,
horarios y el resto de módulos. Debe terminar con `0 FALLAS`.

### 4.2 Backend (puerto 4000)

```bash
cd backend
cp .env.example .env      # ajuste DB_PASSWORD si su Postgres usa otra contraseña
npm install
npm run dev               # modo desarrollo con nodemon (o npm start)
```

API disponible en `http://localhost:4000/api` · verificación rápida en
`http://localhost:4000/` (responde un JSON de estado).

### 4.3 Frontend (puerto 3000)

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Aplicación en `http://localhost:3000/` (Vite redirige `/api` al backend en 4000).

### 4.4 Detener los servicios

Presione `Ctrl + C` en cada terminal (o `Ctrl + C` dos veces si usa `npm run dev`).

---

## 5. Credenciales de acceso

Sembradas por `seed.sql`. **Cambiar en producción.**

Contraseña para **todos los usuarios**: `hola123`

| Rol | Correo |
|-----|--------|
| Súper Administrador | `superadmin@invictus.com` |
| Administrador | `admin@invictus.com` |
| Recepción / Cajero | `recepcion@invictus.com` |
| Entrenador | `entrenador1@invictus.com` |
| Entrenador | `entrenador2@invictus.com` |
| Alumno (x10) | `alumno1@invictus.com` … `alumno10@invictus.com` |

Cada rol ve un menú distinto (control de acceso por roles): el Súper
Administrador tiene acceso total incluida la bitácora; el Administrador gestiona
la operación diaria; Recepción/Cajero registra alumnos y pagos; el Entrenador
toma asistencia y evalúa el progreso; el Alumno consulta su información.

---

## 6. Verificación rápida

1. Abrir la aplicación e iniciar sesión como **Súper Administrador**
   (`superadmin@invictus.com` / `hola123`).
2. En el **Dashboard** deben verse los contadores del sistema: 15 usuarios
   (1 súper admin, 1 administrador, 1 recepcionista, 2 entrenadores y 10
   alumnos), ingresos del mes según alumnos pagados y clases activas del día.
3. En **Alumnos** hay 10 inscritos con nivel deportivo y estado de pago.
4. En **Horarios** debe verse la grilla semanal completa: lunes a viernes en
   tres turnos (09:00–11:00, 14:00–16:00, 19:00–21:00); el viernes por la noche
   es **Sparring**.
5. En **Pagos** están las mensualidades del mes actual (pagadas, pendientes y
   vencidas) y el historial del mes anterior.
6. En **Asistencias** hay registros de las últimas dos semanas (presente,
   tardanza, falta, permiso).
7. En **Progreso** cada alumno tiene dos evaluaciones deportivas.
8. Inicie sesión también como **Entrenador** y como **Alumno** para comprobar
   que cada rol ve únicamente sus módulos.
9. Como Súper Administrador, abra **Bitácora** para ver la auditoría.

Comprobación por consola (opcional):

```bash
docker exec -it invictus-db psql -U postgres -d invictus_boxeo \
  -c "SELECT count(*) FROM usuarios WHERE rol = 'Alumno';"
```

---

## 7. Contenido del paquete

```
invictus/
├── backend/              API REST Express (sin node_modules — se instalan con npm)
├── frontend/             Código React + Vite (sin node_modules)
├── database/
│   ├── schema.sql              Esquema normalizado en 3FN estricto (15 tablas)
│   ├── seed.sql                Usuarios de todos los roles + perfiles
│   ├── seed-demo.sql           Horarios, alumnos, pagos, asistencias y progreso
│   └── migracion_3fn_estricta.sql   Actualiza bases existentes (ver 4.1.1)
│                               Los demás migracion_*.sql son históricos:
│                               NO ejecutarlos
├── nginx/                Configuración del proxy para Docker
├── docker-compose.yml    Orquestación de los tres servicios
└── GUIA-INSTALACION.md   Este documento
```

---

## 8. Problemas frecuentes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| El login falla o no hay usuarios | No se cargó `seed.sql` | Ejecutar `seed.sql` (paso 4.1) |
| No hay horarios ni alumnos | No se cargó `seed-demo.sql` | Ejecutar `seed-demo.sql` |
| Error de binarios al iniciar el frontend | `node_modules` de otro sistema operativo | Borrar `frontend/node_modules` y repetir `npm install` |
| El backend no conecta a la base | PostgreSQL apagado o `.env` incorrecto | Verificar Postgres en `:5432` y el archivo `backend/.env` |
| El puerto 8080 está ocupado (Docker) | Otro servicio usa 8080 | Cambiar el mapeo `"8080:80"` en `docker-compose.yml` |
| El puerto 5432 está ocupado (local) | Ya hay un Postgres con otra contraseña | Ajustar `DB_PASSWORD` en `backend/.env` |
| Quiero empezar de cero | La base tiene datos viejos | Docker: `docker compose down -v`. Local: `dropdb invictus_boxeo` y repetir el paso 4.1 |
| La migración 3FN se aborta | Datos que impiden normalizar (pagos huérfanos, membresías duplicadas, horarios imposibles) | El mensaje indica exactamente qué corregir. Repara y vuelve a ejecutar la migración |
| `columna "u.rol" does not exist` | Se actualizó `schema.sql` pero no el backend, o al revés | Backend y base deben ir juntos: aplicar el paso 4.1.1 o 4.1 completo |
| `relation "perfiles_alumnos" does not exist` | Se ejecutó un `migracion_*.sql` antiguo | Esos archivos son históricos. Ver la nota de la sección 4.1.1 |

---

*INVICTUS — Prototipo tecnológico (MVP). La documentación completa del proyecto
(análisis, marco teórico, metodología Lean, modelado, diseño de la API y
estrategia de pruebas) se encuentra en el documento adjunto
`DOCUMENTO-INVICTUS-APA7.docx`.*
