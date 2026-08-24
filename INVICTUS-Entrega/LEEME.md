# INVICTUS — Entrega

Este paquete contiene el **software** y el **documento** del prototipo
tecnológico (MVP) del Sistema Web Full Stack para la gestión integral de la
**Academia de Boxeo INVICTUS**: alumnos, entrenadores, pagos, horarios,
asistencias, progreso deportivo, reportes y bitácora.

## Contenido

| Elemento | Descripción |
|----------|-------------|
| `invictus/` | Código fuente completo (backend Express, frontend React, base de datos y Docker). |
| `invictus/GUIA-INSTALACION.md` | **Empiece aquí.** Guía paso a paso para instalar, ejecutar y cargar los datos. |
| `DOCUMENTO-INVICTUS-APA7.docx` | Documento del proyecto en formato APA 7 (análisis, marco teórico, metodología Lean y diseño). |

## Inicio rápido

Con **Docker Desktop** instalado, desde la carpeta `invictus/`:

```bash
docker compose up --build -d
```

Luego abra **http://localhost:8080/** e inicie sesión como administrador:

- Usuario: `superadmin@invictus.com`
- Contraseña: `hola123`

La base de datos se crea y se llena automáticamente: usuarios de los 5 roles,
horarios fijos de lunes a viernes (3 turnos), 10 alumnos con sus pagos,
asistencias de las últimas dos semanas y evaluaciones de progreso deportivo.
Las credenciales completas están en la sección 5 de la guía.

> Para instalación sin Docker (Node + PostgreSQL), consulte
> **`invictus/GUIA-INSTALACION.md`**.

## Nota sobre las dependencias

Por tamaño y portabilidad, el paquete **no incluye las carpetas `node_modules`**.
Se instalan automáticamente con Docker, o con `npm install` en la instalación
local (ver la guía). Todo lo necesario para reconstruirlas (`package.json` y
`package-lock.json`) está incluido.
