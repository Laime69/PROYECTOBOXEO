const AlumnoHorario = require('../models/AlumnoHorario');
const Horario = require('../models/Horario');

class AlumnoHorarioService {
  async asignar(alumno_id, horario_id, observacion = null) {
    const horario = await Horario.findById(horario_id);
    if (!horario) throw new Error('Horario no encontrado');
    if (horario.estado !== 'activo') throw new Error('El horario no está activo');

    const existente = await AlumnoHorario.findActivoByAlumno(alumno_id);
    if (existente) {
      throw new Error('El alumno ya tiene un horario activo. Usa cambiarHorario en su lugar.');
    }

    return await AlumnoHorario.crear({ alumno_id, horario_id, observacion });
  }

  async asignarPorTurno(alumno_id, turno, observacion = null) {
    const turnosValidos = ['manana', 'tarde', 'noche'];
    if (!turnosValidos.includes(turno)) {
      throw new Error('Turno inválido. Debe ser: manana, tarde o noche');
    }

    const horarios = await Horario.findByTurno(turno);
    if (horarios.length === 0) {
      throw new Error('No hay horarios disponibles para este turno');
    }

    const existente = await AlumnoHorario.findActivoByAlumno(alumno_id);
    if (existente) {
      await AlumnoHorario.desactivar(existente.id);
    }

    return await AlumnoHorario.crear({
      alumno_id,
      horario_id: horarios[0].id_horario,
      observacion: observacion || `Asignado a turno ${turno}`,
      turno,
    });
  }

  async cambiarHorario(alumno_id, nuevo_horario_id, observacion = null) {
    const horario = await Horario.findById(nuevo_horario_id);
    if (!horario) throw new Error('Horario no encontrado');
    if (horario.estado !== 'activo') throw new Error('El horario no está activo');

    const activo = await AlumnoHorario.findActivoByAlumno(alumno_id);
    if (activo) {
      if (activo.horario_id === nuevo_horario_id) {
        throw new Error('El alumno ya tiene este horario asignado');
      }
      await AlumnoHorario.desactivar(activo.id);
    }

    return await AlumnoHorario.crear({
      alumno_id, horario_id: nuevo_horario_id,
      observacion: observacion || 'Cambio de horario',
    });
  }

  async cambiarTurno(alumno_id, nuevo_turno, observacion = null) {
    const turnosValidos = ['manana', 'tarde', 'noche'];
    if (!turnosValidos.includes(nuevo_turno)) {
      throw new Error('Turno inválido. Debe ser: manana, tarde o noche');
    }

    const horarios = await Horario.findByTurno(nuevo_turno);
    if (horarios.length === 0) {
      throw new Error('No hay horarios disponibles para este turno');
    }

    await AlumnoHorario.desactivarByAlumno(alumno_id);

    return await AlumnoHorario.crear({
      alumno_id,
      horario_id: horarios[0].id_horario,
      observacion: observacion || `Cambio a turno ${nuevo_turno}`,
      turno: nuevo_turno,
    });
  }

  async getHorarioActual(alumno_id) {
    const asignacion = await AlumnoHorario.findActivoByAlumno(alumno_id);
    if (!asignacion) return null;

    const turno = asignacion.turno || asignacion.turno_horario;
    if (turno) {
      const horarios = await Horario.findByTurno(turno);
      return {
        ...asignacion,
        turno,
        horarios_semana: horarios,
      };
    }

    return asignacion;
  }

  async getAlumnosByHorario(horario_id) {
    return await AlumnoHorario.findByHorario(horario_id);
  }

  async getAlumnosByEntrenador(entrenador_id) {
    return await AlumnoHorario.findAll({ entrenador_id, estado: 'activo' });
  }

  async getHistorialByAlumno(alumno_id) {
    return await AlumnoHorario.findHistorialByAlumno(alumno_id);
  }

  async getAlumnosByTurno(turno) {
    return await AlumnoHorario.findActivosByTurno(turno);
  }
}

module.exports = new AlumnoHorarioService();
