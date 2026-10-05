const Asistencia = require('../models/Asistencia');
const Horario = require('../models/Horario');
const AlumnoHorario = require('../models/AlumnoHorario');

const DIAS_SEMANA = {
  'lunes': 'lunes', 'martes': 'martes', 'miercoles': 'miercoles',
  'jueves': 'jueves', 'viernes': 'viernes',
  'Lunes': 'lunes', 'Martes': 'martes', 'Miércoles': 'miercoles',
  'Jueves': 'jueves', 'Viernes': 'viernes'
};

function getDiaSemana(fecha) {
  const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const date = new Date(fecha + 'T12:00:00');
  return dias[date.getDay()];
}

function getTipoActividad(diaSemana) {
  return diaSemana === 'viernes' ? 'sparring' : 'entrenamiento';
}

function esFechaFutura(fechaStr) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr + 'T00:00:00');
  return fecha > hoy;
}

class AsistenciaService {
  async list(filtros = {}, currentUser = null) {
    if (currentUser && currentUser.rol === 'Entrenador') {
      filtros.entrenador_id = currentUser.id_usuario;
    }
    return await Asistencia.findAll(filtros);
  }

  async getById(id, currentUser = null) {
    const asistencia = await Asistencia.findById(id);
    if (!asistencia) {
      throw new Error('Asistencia no encontrada');
    }
    if (currentUser && currentUser.rol === 'Entrenador' && asistencia.entrenador_id !== currentUser.id_entrenador) {
      throw new Error('No tienes permiso para ver esta asistencia');
    }
    return asistencia;
  }

  async create(data, currentUser = null) {
    if (data.fecha && esFechaFutura(data.fecha)) {
      throw new Error('No se puede registrar asistencia en una fecha futura');
    }

    if (currentUser && currentUser.rol === 'Entrenador') {
      const estaEnMisHorarios = await this._esAlumnoDeEntrenador(data.alumno_id, currentUser.id_entrenador);
      if (!estaEnMisHorarios) {
        throw new Error('No puedes registrar asistencia de un alumno que no te corresponde');
      }
    }

    if (!data.tipo_actividad && data.fecha) {
      const diaSemana = getDiaSemana(data.fecha);
      data.tipo_actividad = getTipoActividad(diaSemana);
    }

    if (!data.horario_id && data.alumno_id) {
      try {
        const asignacion = await AlumnoHorario.findActivoByAlumno(data.alumno_id);
        if (asignacion) {
          data.horario_id = asignacion.horario_id;
        }
      } catch (e) {
        console.warn('[AsistenciaService] No se pudo obtener horario del alumno:', e.message);
      }
    }

    return await Asistencia.crear(data);
  }

  async update(id, data, currentUser = null) {
    const existente = await Asistencia.findById(id);
    if (!existente) {
      throw new Error('Asistencia no encontrada');
    }

    if (data.fecha && esFechaFutura(data.fecha)) {
      throw new Error('No se puede registrar asistencia en una fecha futura');
    }

    if (currentUser && currentUser.rol === 'Entrenador') {
      if (existente.entrenador_id !== currentUser.id_entrenador) {
        throw new Error('No tienes permiso para modificar esta asistencia');
      }
    }
    const updated = await Asistencia.update(id, data);
    return updated;
  }

  async remove(id, currentUser = null) {
    const existente = await Asistencia.findById(id);
    if (!existente) {
      throw new Error('Asistencia no encontrada');
    }
    if (currentUser && currentUser.rol === 'Entrenador') {
      if (existente.entrenador_id !== currentUser.id_entrenador) {
        throw new Error('No tienes permiso para eliminar esta asistencia');
      }
    }
    await Asistencia.deleteById(id);
    return { message: 'Asistencia eliminada correctamente' };
  }

  async getStats(currentUser = null) {
    if (currentUser && currentUser.rol === 'Entrenador') {
      return await Asistencia.countAllByEntrenador(currentUser.id_usuario);
    }
    return await Asistencia.countAll();
  }

  async _esAlumnoDeEntrenador(alumnoId, idEntrenador) {
    if (!alumnoId) return false;
    const asignacion = await AlumnoHorario.findActivoByAlumno(alumnoId);
    if (asignacion && asignacion.entrenador_id === idEntrenador) {
      return true;
    }
    const horarios = await Horario.findAll({ entrenador_id: idEntrenador, estado: 'activo' });
    for (const h of horarios) {
      const ah = await AlumnoHorario.findByHorarioAndAlumno(h.id_horario, alumnoId);
      if (ah && ah.estado === 'activo') return true;
    }
    return false;
  }
}

module.exports = new AsistenciaService();
