const AlumnoHorario = require('../models/AlumnoHorario');
const Horario = require('../models/Horario');

const TURNOS_VALIDOS = ['manana', 'tarde', 'noche'];

class AlumnoHorarioService {
  // Un alumno puede estar en varios bloques activos a la vez. Cada operación
  // solo toca el bloque concerned: desactivar todo sería incorrecto.
  async asignar(alumno_id, horario_id, observacion = null) {
    const horario = await Horario.findById(horario_id);
    if (!horario) throw new Error('Horario no encontrado');
    if (horario.estado !== 'activo') throw new Error('El horario no está activo');

    // Libera únicamente el mismo bloque, para no chocar con el índice único
    // (alumno_id, horario_id) de las asignaciones activas.
    await AlumnoHorario.desactivarPorHorarioYAlumno(horario_id, alumno_id);

    return await AlumnoHorario.crear({ alumno_id, horario_id, observacion });
  }

  async asignarPorTurno(alumno_id, turno, observacion = null) {
    if (!TURNOS_VALIDOS.includes(turno)) {
      throw new Error('Turno inválido. Debe ser: manana, tarde o noche');
    }

    const horarios = await Horario.findByTurno(turno);
    if (horarios.length === 0) {
      throw new Error('No hay horarios disponibles para este turno');
    }

    const destino = horarios[0].id_horario;
    await AlumnoHorario.desactivarPorHorarioYAlumno(destino, alumno_id);

    return await AlumnoHorario.crear({
      alumno_id,
      horario_id: destino,
      observacion: observacion || `Asignado a turno ${turno}`,
    });
  }

  async cambiarHorario(alumno_id, nuevo_horario_id, observacion = null) {
    const horario = await Horario.findById(nuevo_horario_id);
    if (!horario) throw new Error('Horario no encontrado');
    if (horario.estado !== 'activo') throw new Error('El horario no está activo');

    const yaTiene = await AlumnoHorario.findByHorarioAndAlumno(nuevo_horario_id, alumno_id);
    if (yaTiene && yaTiene.estado === 'activo') {
      throw new Error('El alumno ya tiene este horario asignado');
    }

    await AlumnoHorario.desactivarPorHorarioYAlumno(nuevo_horario_id, alumno_id);

    return await AlumnoHorario.crear({
      alumno_id,
      horario_id: nuevo_horario_id,
      observacion: observacion || 'Cambio de horario',
    });
  }

  async cambiarTurno(alumno_id, nuevo_turno, observacion = null) {
    if (!TURNOS_VALIDOS.includes(nuevo_turno)) {
      throw new Error('Turno inválido. Debe ser: manana, tarde o noche');
    }

    const horarios = await Horario.findByTurno(nuevo_turno);
    if (horarios.length === 0) {
      throw new Error('No hay horarios disponibles para este turno');
    }

    const destino = horarios[0].id_horario;
    await AlumnoHorario.desactivarPorHorarioYAlumno(destino, alumno_id);

    return await AlumnoHorario.crear({
      alumno_id,
      horario_id: destino,
      observacion: observacion || `Cambio a turno ${nuevo_turno}`,
    });
  }

  // Contrato original: un solo horario. Se toma el más reciente.
  async getHorarioActual(alumno_id) {
    const asignacion = await AlumnoHorario.findActivoByAlumno(alumno_id);
    if (!asignacion) return null;

    const turno = asignacion.nombre_turno || asignacion.turno_horario;
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

  // Todos los bloques activos del alumno.
  async getHorarios(alumno_id) {
    return await AlumnoHorario.findActivosByAlumno(alumno_id);
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
