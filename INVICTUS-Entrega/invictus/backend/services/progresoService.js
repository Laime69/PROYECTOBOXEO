const Progreso = require('../models/Progreso');
const AlumnoHorario = require('../models/AlumnoHorario');

class ProgresoService {
  async list(filtros, currentUser) {
    const query = { ...filtros };
    delete query.turno;

    if (currentUser.rol === 'Entrenador') {
      const horarios = await AlumnoHorario.findAll({ entrenador_id: currentUser.id_usuario, estado: 'activo' });
      const alumnoIds = [...new Set(horarios.map(h => h.alumno_id))];
      if (alumnoIds.length === 0) return [];
      query.alumno_ids = alumnoIds;
    }

    const registros = await Progreso.findAll(query);
    return registros;
  }

  async create(data, currentUser) {
    const { alumno_id, tecnica, defensa, resistencia, velocidad, fuerza, disciplina, sparring } = data;

    if (!alumno_id) {
      throw new Error('alumno_id es requerido');
    }

    const scores = { tecnica, defensa, resistencia, velocidad, fuerza, disciplina, sparring };
    for (const [key, val] of Object.entries(scores)) {
      if (val !== undefined && val !== null) {
        const num = parseInt(val);
        if (isNaN(num) || num < 1 || num > 10) {
          throw new Error(`${key} debe ser un número entre 1 y 10`);
        }
      }
    }

    if (currentUser.rol === 'Entrenador') {
      const horarios = await AlumnoHorario.findAll({ entrenador_id: currentUser.id_usuario, estado: 'activo' });
      const alumnoIds = [...new Set(horarios.map(h => h.alumno_id))];
      if (!alumnoIds.includes(alumno_id)) {
        throw new Error('No puedes registrar progreso de un alumno que no te corresponde');
      }
    }

    let nivel = data.nivel;
    if (!nivel) {
      nivel = this._calcularNivel({ tecnica, defensa, resistencia, velocidad, fuerza, disciplina, sparring });
    }

    const progreso = await Progreso.crear({
      ...data,
      entrenador_id: data.entrenador_id || currentUser.id_usuario,
      nivel,
    });
    return progreso;
  }

  async update(id, data, currentUser) {
    const existente = await Progreso.findById(id);
    if (!existente) throw new Error('Evaluación no encontrada');

    const scores = { tecnica: data.tecnica, defensa: data.defensa, resistencia: data.resistencia, velocidad: data.velocidad, fuerza: data.fuerza, disciplina: data.disciplina, sparring: data.sparring };
    for (const [key, val] of Object.entries(scores)) {
      if (val !== undefined && val !== null) {
        const num = parseInt(val);
        if (isNaN(num) || num < 1 || num > 10) {
          throw new Error(`${key} debe ser un número entre 1 y 10`);
        }
      }
    }

    if (currentUser.rol === 'Entrenador') {
      const horarios = await AlumnoHorario.findAll({ entrenador_id: currentUser.id_usuario, estado: 'activo' });
      const alumnoIds = [...new Set(horarios.map(h => h.alumno_id))];
      if (!alumnoIds.includes(existente.alumno_id)) {
        throw new Error('No puedes modificar progreso de un alumno que no te corresponde');
      }
    }

    let nivel = data.nivel;
    if (!nivel && (data.tecnica !== undefined || data.defensa !== undefined)) {
      nivel = this._calcularNivel({
        tecnica: data.tecnica ?? existente.tecnica,
        defensa: data.defensa ?? existente.defensa,
        resistencia: data.resistencia ?? existente.resistencia,
        velocidad: data.velocidad ?? existente.velocidad,
        fuerza: data.fuerza ?? existente.fuerza,
        disciplina: data.disciplina ?? existente.disciplina,
        sparring: data.sparring ?? existente.sparring,
      });
    }

    const updated = await Progreso.update(id, { ...data, nivel });
    return updated;
  }

  async getHistorial(alumnoId, currentUser) {
    if (currentUser.rol === 'Alumno' && currentUser.id_usuario !== alumnoId) {
      throw new Error('No puedes ver el progreso de otro alumno');
    }

    if (currentUser.rol === 'Entrenador') {
      const horarios = await AlumnoHorario.findAll({ entrenador_id: currentUser.id_usuario, estado: 'activo' });
      const alumnoIds = [...new Set(horarios.map(h => h.alumno_id))];
      if (!alumnoIds.includes(alumnoId)) {
        throw new Error('No puedes ver el progreso de un alumno que no te corresponde');
      }
    }

    const registros = await Progreso.findByAlumno(alumnoId);
    return registros;
  }

  async getMisProgresos(currentUser) {
    const registros = await Progreso.findByAlumno(currentUser.id_usuario);
    const ultimo = registros.length > 0 ? registros[0] : null;
    return {
      ultima_evaluacion: ultimo,
      historial: registros,
      total_evaluaciones: registros.length,
    };
  }

  async getResumen(filtros, currentUser) {
    const resumen = await Progreso.getResumenGeneral(filtros);
    const alumnos = await Progreso.getUltimaEvaluacionPorAlumno(filtros);

    const conPromedio = alumnos.filter(a => a.promedio !== null);
    conPromedio.sort((a, b) => b.promedio - a.promedio);
    const mejorProgreso = conPromedio.slice(0, 5);
    const bajoProgreso = [...conPromedio].reverse().slice(0, 5);

    return {
      ...resumen,
      alumnos,
      mejor_progreso: mejorProgreso,
      bajo_progreso: bajoProgreso,
    };
  }

  _calcularNivel({ tecnica, defensa, resistencia, velocidad, fuerza, disciplina, sparring }) {
    const puntajes = [tecnica, defensa, resistencia, velocidad, fuerza, disciplina, sparring]
      .filter(p => p != null && p >= 1 && p <= 10);

    if (puntajes.length === 0) return 'basico';

    const suma = puntajes.reduce((a, b) => a + b, 0);
    const promedio = suma / puntajes.length;

    if (promedio < 4) return 'inicial';
    if (promedio < 6) return 'basico';
    if (promedio < 8) return 'intermedio';
    if (promedio < 9.5) return 'avanzado';
    return 'competitivo';
  }
}

module.exports = new ProgresoService();
