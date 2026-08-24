const AlumnoHorario = require('../models/AlumnoHorario');
const Horario = require('../models/Horario');

class EntrenadorService {
  async getMisHorarios(entrenadorId) {
    const horarios = await Horario.findAll({ entrenador_id: entrenadorId });
    for (const h of horarios) {
      h.total_alumnos = await AlumnoHorario.contarAlumnosByHorario(h.id_horario);
    }
    return horarios;
  }

  async getMisAlumnos(entrenadorId) {
    const horarios = await Horario.findAll({ entrenador_id: entrenadorId });
    const turnos = [...new Set(horarios.filter(h => h.turno).map(h => h.turno))];

    if (turnos.length > 0) {
      const result = [];
      for (const turno of turnos) {
        const alumnos = await AlumnoHorario.findActivosByTurno(turno);
        for (const a of alumnos) {
          const horarioDelDia = horarios.find(h => h.turno === turno);
          result.push({
            ...a,
            clase: horarioDelDia?.clase || 'Boxeo',
            hora_inicio: horarioDelDia?.hora_inicio,
            hora_fin: horarioDelDia?.hora_fin,
            nombre_turno: horarioDelDia?.nombre_turno,
            turno_asignado: turno,
          });
        }
      }
      if (result.length > 0) return result;
    }

    return await AlumnoHorario.findAll({ entrenador_id: entrenadorId, estado: 'activo' });
  }
}

module.exports = new EntrenadorService();
