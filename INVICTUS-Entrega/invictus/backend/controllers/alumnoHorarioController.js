const alumnoHorarioService = require('../services/alumnoHorarioService');

const asignarHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const { horario_id, observacion } = req.body;
    if (!horario_id) {
      return res.status(400).json({ msg: 'horario_id es requerido' });
    }
    const result = await alumnoHorarioService.asignar(id, horario_id, observacion);
    return res.status(201).json({ msg: 'Horario asignado correctamente', asignacion: result });
  } catch (error) {
    const msg = error.message;
    if (msg.includes('no encontrado') || msg.includes('cupo') || msg.includes('ya tiene')) {
      return res.status(400).json({ msg });
    }
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const asignarTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const { turno, observacion } = req.body;
    if (!turno) {
      return res.status(400).json({ msg: 'turno es requerido (manana, tarde, noche)' });
    }
    const result = await alumnoHorarioService.asignarPorTurno(id, turno, observacion);
    return res.status(201).json({ msg: `Turno ${turno} asignado correctamente`, asignacion: result });
  } catch (error) {
    const msg = error.message;
    if (msg.includes('válido') || msg.includes('disponibles') || msg.includes('no encontrado')) {
      return res.status(400).json({ msg });
    }
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const cambiarHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const { horario_id, observacion } = req.body;
    if (!horario_id) {
      return res.status(400).json({ msg: 'horario_id es requerido' });
    }
    const result = await alumnoHorarioService.cambiarHorario(id, horario_id, observacion);
    return res.status(200).json({ msg: 'Horario cambiado correctamente', asignacion: result });
  } catch (error) {
    const msg = error.message;
    if (msg.includes('no encontrado') || msg.includes('cupo') || msg.includes('ya tiene')) {
      return res.status(400).json({ msg });
    }
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const cambiarTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const { turno, observacion } = req.body;
    if (!turno) {
      return res.status(400).json({ msg: 'turno es requerido (manana, tarde, noche)' });
    }
    const result = await alumnoHorarioService.cambiarTurno(id, turno, observacion);
    return res.status(200).json({ msg: `Turno cambiado a ${turno} correctamente`, asignacion: result });
  } catch (error) {
    const msg = error.message;
    if (msg.includes('válido') || msg.includes('disponibles')) {
      return res.status(400).json({ msg });
    }
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getHorarioActual = async (req, res) => {
  try {
    const { id } = req.params;
    const horario = await alumnoHorarioService.getHorarioActual(id);
    if (!horario) {
      return res.status(404).json({ msg: 'No se encontró horario asignado' });
    }
    return res.status(200).json({ horario });
  } catch (error) {
    console.error('[AlumnoHorarioController:getHorarioActual]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getAlumnosByHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const alumnos = await alumnoHorarioService.getAlumnosByHorario(id);
    return res.status(200).json({ alumnos: alumnos || [] });
  } catch (error) {
    console.error('[AlumnoHorarioController:getAlumnosByHorario]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getAlumnosByTurno = async (req, res) => {
  try {
    const { turno } = req.params;
    const alumnos = await alumnoHorarioService.getAlumnosByTurno(turno);
    return res.status(200).json({ alumnos: alumnos || [] });
  } catch (error) {
    console.error('[AlumnoHorarioController:getAlumnosByTurno]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

module.exports = { asignarHorario, asignarTurno, cambiarHorario, cambiarTurno, getHorarioActual, getAlumnosByHorario, getAlumnosByTurno };
