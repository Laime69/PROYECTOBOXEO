const Asistencia = require('../models/Asistencia');
const Horario = require('../models/Horario');
const Usuario = require('../models/Usuario');
const Pago = require('../models/Pago');

class ReporteService {
  async getAsistenciasEntrenador(entrenadorId, fechaInicio = null, fechaFin = null) {
    return await Asistencia.countAllByEntrenador(entrenadorId, fechaInicio, fechaFin);
  }

  async getResumenGeneral() {
    const usuarios = await Usuario.countAll();
    const asistencias = await Asistencia.countAll();
    const horarios = await Horario.countAll();
    const alumnosPagados = await Usuario.countPagados();

    return {
      total_usuarios: usuarios.total,
      total_alumnos: usuarios.alumnos,
      total_entrenadores: usuarios.entrenadores,
      total_administradores: usuarios.administradores,
      alumnos_pagados: alumnosPagados,
      asistencias_totales: asistencias.total,
      asistencias_presentes: asistencias.presentes,
      asistencias_faltas: asistencias.faltas,
      horarios_totales: horarios.total,
      horarios_activos: horarios.activos,
    };
  }

  async getDetalleAsistencias(filtros) {
    const filas = await Asistencia.findAll(filtros);

    const resumen = {
      total: filas.length,
      presentes: 0,
      faltas: 0,
      tardanzas: 0,
      justificados: 0,
      permisos: 0,
      alumnos_distintos: new Set(filas.map((f) => f.alumno_id)).size,
      dias_distintos: new Set(filas.map((f) => String(f.fecha).slice(0, 10))).size,
    };

    for (const fila of filas) {
      if (fila.estado === 'presente') resumen.presentes += 1;
      else if (fila.estado === 'falta') resumen.faltas += 1;
      else if (fila.estado === 'tardanza') resumen.tardanzas += 1;
      else if (fila.estado === 'justificado') resumen.justificados += 1;
      else if (fila.estado === 'permiso') resumen.permisos += 1;
    }

    return { filas, resumen };
  }

  async getReportePagos({ mes, anio, estado, turno, busqueda }) {
    const hoy = new Date();
    const mesNum = mes ? parseInt(mes, 10) : hoy.getMonth() + 1;
    const anioNum = anio ? parseInt(anio, 10) : hoy.getFullYear();

    if (anioNum > hoy.getFullYear() || (anioNum === hoy.getFullYear() && mesNum > hoy.getMonth() + 1)) {
      return {
        es_futuro: true,
        resumen: null,
        filtros_aplicados: { pagados: 0, pendientes: 0, vencidos: 0, ingresos: 0 },
        filas: [],
      };
    }

    const [resumenMes, filasAll] = await Promise.all([
      Pago.getResumen(mes, anio),
      Pago.findAll({ mes, anio, estado, turno, busqueda }),
    ]);

    const resumen = { ...resumenMes };
    const esMesActual = anioNum === hoy.getFullYear() && mesNum === hoy.getMonth() + 1;
    const filas = esMesActual ? filasAll : filasAll.filter(f => f.id_pago);

    if (!esMesActual) {
      resumen.total_alumnos = resumen.registros_mes;
      resumen.pendientes_mes = Math.max(0, resumen.total_alumnos - resumen.pagados_mes - resumen.vencidos);
    }
    delete resumen.registros_mes;

    let ingresos_filtrados = 0;
    let pagados_filtrados = 0;
    let pendientes_filtrados = 0;
    let vencidos_filtrados = 0;

    for (const fila of filas) {
      if (fila.estado_pago === 'pagado') {
        pagados_filtrados += 1;
        ingresos_filtrados += Number(fila.monto) || 0;
      } else if (fila.estado_pago === 'vencido') {
        vencidos_filtrados += 1;
      } else {
        pendientes_filtrados += 1;
      }
    }

    return {
      resumen,
      filtros_aplicados: { pagados: pagados_filtrados, pendientes: pendientes_filtrados, vencidos: vencidos_filtrados, ingresos: ingresos_filtrados },
      filas,
    };
  }

  async getAsistenciasPorFecha(fechaInicio, fechaFin) {
    return await Asistencia.countByFecha(fechaInicio, fechaFin);
  }
}

module.exports = new ReporteService();
