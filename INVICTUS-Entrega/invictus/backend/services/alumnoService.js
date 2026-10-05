const Usuario = require('../models/Usuario');
const Alumno = require('../models/Alumno');
const Horario = require('../models/Horario');
const Asistencia = require('../models/Asistencia');
const AlumnoHorario = require('../models/AlumnoHorario');

class AlumnoService {
  async _resolverAlumno(usuarioId) {
    const alumno = await Alumno.findByUsuarioId(usuarioId);
    if (!alumno) throw new Error('Alumno no encontrado');
    return alumno;
  }

  async getPerfil(usuarioId) {
    const alumno = await this._resolverAlumno(usuarioId);
    return {
      id_usuario: alumno.id_usuario,
      alumno_id: alumno.id_alumno,
      nombre: alumno.nombre,
      correo: alumno.correo,
      fecha_inscripcion: alumno.fecha_inscripcion,
      fecha_vencimiento: alumno.fecha_vencimiento,
      estado_pago: alumno.estado_pago,
      fecha_creacion: alumno.fecha_creacion,
    };
  }

  async getHorarios(usuarioId) {
    const alumno = await this._resolverAlumno(usuarioId);
    const asignacion = await AlumnoHorario.findActivoByAlumno(alumno.id_alumno);
    if (!asignacion) {
      return { asignado: null };
    }

    const turno = asignacion.turno || asignacion.nombre_turno || asignacion.turno_horario;
    if (turno) {
      const horarios = await Horario.findByTurno(turno);
      return {
        asignado: {
          ...asignacion,
          turno,
          horarios_semana: horarios,
        }
      };
    }

    return { asignado: asignacion };
  }

  async getAsistencias(usuarioId, filtros = {}) {
    const alumno = await this._resolverAlumno(usuarioId);
    filtros.alumno_id = alumno.id_alumno;
    return await Asistencia.findAll(filtros);
  }

  async getEstadoPago(usuarioId) {
    const alumno = await this._resolverAlumno(usuarioId);
    return {
      estado_pago: alumno.estado_pago,
      fecha_inscripcion: alumno.fecha_inscripcion,
      fecha_vencimiento: alumno.fecha_vencimiento,
    };
  }

  async getDashboard(usuarioId) {
    const alumno = await this._resolverAlumno(usuarioId);
    const usuario = await Usuario.findById(alumno.id_usuario);
    if (!usuario) throw new Error('Usuario no encontrado');
    const asignacion = await AlumnoHorario.findActivoByAlumno(alumno.id_alumno);

    let horarioAsignado = null;
    if (asignacion) {
      const turno = asignacion.turno || asignacion.nombre_turno || asignacion.turno_horario;
      if (turno) {
        const horarios = await Horario.findByTurno(turno);
        const nombresTurno = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };
        horarioAsignado = {
          nombre_turno: nombresTurno[turno] || turno,
          turno,
          dias: 'Lunes a Viernes',
          hora_inicio: '09:00',
          hora_fin: '21:00',
          clase: 'Boxeo',
          entrenador_nombre: horarios.find(h => h.entrenador_nombre)?.entrenador_nombre || null,
          horarios_semana: horarios.map(h => ({
            dia_semana: h.dia_semana,
            dia: h.dia,
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
            entrenador_nombre: h.entrenador_nombre,
            tipo_actividad: h.tipo_actividad,
          })),
        };
      } else {
        horarioAsignado = {
          nombre_turno: asignacion.nombre_turno,
          dias: asignacion.dias,
          hora_inicio: asignacion.hora_inicio,
          hora_fin: asignacion.hora_fin,
          clase: asignacion.clase,
          entrenador_nombre: asignacion.entrenador_nombre,
        };
      }
    }

    const asistenciasRecientes = await Asistencia.findAll({
      alumno_id: alumno.id_alumno,
    });
    const totalAsistencias = asistenciasRecientes.length;
    const presentes = asistenciasRecientes.filter(a => a.estado === 'presente').length;
    const porcentajeAsistencia = totalAsistencias > 0
      ? Math.round((presentes / totalAsistencias) * 100)
      : null;

    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaActual = diasSemana[new Date().getDay()];
    const es_fin_de_semana = diaActual === 'sabado' || diaActual === 'domingo';
    const es_sparring = diaActual === 'viernes';
    const dia_nombre = diaActual.charAt(0).toUpperCase() + diaActual.slice(1);

    let clases_hoy = { activas: 0, total: 0, texto: 'Sin clases hoy', es_sparring: false };
    let clases_hoy_detalles = [];

    if (!es_fin_de_semana) {
      const horarios = await Horario.findByDia(diaActual);
      const total = horarios.length;
      const activas = horarios.filter(h => h.estado === 'activo').length;
      clases_hoy_detalles = horarios.filter(h => h.estado === 'activo');
      clases_hoy = {
        activas,
        total,
        texto: es_sparring ? `${activas}/${total} sparring` : `${activas}/${total} activas`,
        es_sparring,
      };
    }

    const horarios_semana = await Horario.countAllHorarios();

    return {
      nombre: alumno.nombre,
      correo: alumno.correo,
      alumno_id: alumno.id_alumno,
      estado_pago: alumno.estado_pago,
      fecha_inscripcion: alumno.fecha_inscripcion,
      fecha_vencimiento: alumno.fecha_vencimiento,
      horario_asignado: horarioAsignado,
      total_asistencias: totalAsistencias,
      asistencias_presentes: presentes,
      porcentaje_asistencia: porcentajeAsistencia,
      clases_hoy,
      clases_hoy_detalles,
      dia_nombre,
      es_sparring,
      es_fin_de_semana,
      horarios_semana,
    };
  }
}

module.exports = new AlumnoService();