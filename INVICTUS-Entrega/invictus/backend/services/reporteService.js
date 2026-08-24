const Asistencia = require('../models/Asistencia');
const Horario = require('../models/Horario');
const Usuario = require('../models/Usuario');

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

  async getAsistenciasPorFecha(fechaInicio, fechaFin) {
    return await Asistencia.countByFecha(fechaInicio, fechaFin);
  }

  async getResumenPagos() {
    const usuarios = await Usuario.countAll();
    const pagados = await Usuario.countPagados();
    return {
      total_alumnos: usuarios.alumnos,
      alumnos_pagados: pagados,
      alumnos_pendientes: usuarios.alumnos - pagados,
    };
  }
}

module.exports = new ReporteService();
