const Horario = require('../models/Horario');
const AlumnoHorario = require('../models/AlumnoHorario');

class HorarioService {
  async list(filtros = {}, currentUser = null) {
    if (currentUser && currentUser.rol === 'Entrenador') {
      filtros.entrenador_id = currentUser.id_entrenador;
    }
    return await Horario.findAll(filtros);
  }

  async getById(id) {
    const horario = await Horario.findById(id);
    if (!horario) {
      throw new Error('Horario no encontrado');
    }
    return horario;
  }

  async create(data) {
    return await Horario.crear(data);
  }

  async update(id, data) {
    const existente = await Horario.findById(id);
    if (!existente) {
      throw new Error('Horario no encontrado');
    }
    const updated = await Horario.update(id, data);
    return updated;
  }

  async remove(id) {
    const existente = await Horario.findById(id);
    if (!existente) {
      throw new Error('Horario no encontrado');
    }
    const alumnosAsignados = await AlumnoHorario.findByHorario(id);
    const activos = alumnosAsignados.filter(a => a.estado === 'activo');
    if (activos.length > 0) {
      throw new Error(`No se puede eliminar: hay ${activos.length} alumno(s) asignado(s) a este horario. Primero reasignue o desvincule a los alumnos.`);
    }
    await AlumnoHorario.desactivarByHorario(id);
    await Horario.deleteById(id);
    return { message: 'Horario eliminado correctamente' };
  }

  async getStats() {
    return await Horario.countAll();
  }

  async getGrilla(currentUser = null) {
    const horarios = await Horario.findGrilla();
    if (currentUser && currentUser.rol === 'Entrenador') {
      return horarios.filter(h => h.entrenador_id === currentUser.id_entrenador);
    }
    return horarios;
  }

  async getHorariosByTurno(turno) {
    return await Horario.findByTurno(turno);
  }
}

module.exports = new HorarioService();
