const horarioService = require('../services/horarioService');

const grilla = async (req, res) => {
  try {
    const horarios = await horarioService.getGrilla(req.usuario);
    return res.status(200).json({ horarios });
  } catch (error) {
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const list = async (req, res) => {
  try {
    const { dia, entrenador_id, estado, nombre_turno, turno, dia_semana, tipo_actividad } = req.query;
    const filtros = {};
    if (dia) filtros.dia = dia;
    if (entrenador_id) filtros.entrenador_id = entrenador_id;
    if (estado) filtros.estado = estado;
    if (nombre_turno) filtros.nombre_turno = nombre_turno;
    if (turno) filtros.turno = turno;
    if (dia_semana) filtros.dia_semana = dia_semana;
    if (tipo_actividad) filtros.tipo_actividad = tipo_actividad;

    const horarios = await horarioService.list(filtros, req.usuario);
    return res.status(200).json({ horarios });
  } catch (error) {
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const horario = await horarioService.getById(id);
    return res.status(200).json({ horario });
  } catch (error) {
    if (error.message === 'Horario no encontrado') {
      return res.status(404).json({ msg: error.message });
    }
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  try {
    const { entrenador_id, dia, hora_inicio, hora_fin, clase, grupo, estado, nombre_turno, dias, cupo_maximo, dia_semana, turno, tipo_actividad } = req.body;
    if ((!dia && !dia_semana) || !hora_inicio || !hora_fin) {
      return res.status(400).json({ msg: 'dia (o dia_semana), hora_inicio y hora_fin son requeridos' });
    }
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({ msg: 'La hora de inicio debe ser menor que la hora de fin' });
    }
    if (turno && !['manana', 'tarde', 'noche'].includes(turno)) {
      return res.status(400).json({ msg: 'El turno debe ser manana, tarde o noche' });
    }
    if (estado && !['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ msg: 'El estado debe ser activo o inactivo' });
    }
    if (tipo_actividad && !['entrenamiento', 'sparring'].includes(tipo_actividad)) {
      return res.status(400).json({ msg: 'El tipo de actividad debe ser entrenamiento o sparring' });
    }
    const horario = await horarioService.create({
      entrenador_id, dia, hora_inicio, hora_fin, clase, grupo, estado, nombre_turno, dias, cupo_maximo, dia_semana, turno, tipo_actividad,
    });
    return res.status(201).json({ msg: 'Horario creado', horario });
  } catch (error) {
    console.error('[HorarioController:create]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.hora_inicio && req.body.hora_fin && req.body.hora_inicio >= req.body.hora_fin) {
      return res.status(400).json({ msg: 'La hora de inicio debe ser menor que la hora de fin' });
    }
    if (req.body.turno && !['manana', 'tarde', 'noche'].includes(req.body.turno)) {
      return res.status(400).json({ msg: 'El turno debe ser manana, tarde o noche' });
    }
    if (req.body.estado && !['activo', 'inactivo'].includes(req.body.estado)) {
      return res.status(400).json({ msg: 'El estado debe ser activo o inactivo' });
    }
    if (req.body.tipo_actividad && !['entrenamiento', 'sparring'].includes(req.body.tipo_actividad)) {
      return res.status(400).json({ msg: 'El tipo de actividad debe ser entrenamiento o sparring' });
    }
    const horario = await horarioService.update(id, req.body);
    return res.status(200).json({ msg: 'Horario actualizado', horario });
  } catch (error) {
    if (error.message === 'Horario no encontrado') {
      return res.status(404).json({ msg: error.message });
    }
    console.error('[HorarioController:update]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await horarioService.remove(id);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Horario no encontrado') {
      return res.status(404).json({ msg: error.message });
    }
    if (error.message && error.message.includes('alumnos asignados')) {
      return res.status(400).json({ msg: error.message });
    }
    console.error('[HorarioController:remove]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

module.exports = { grilla, list, getById, create, update, remove };
