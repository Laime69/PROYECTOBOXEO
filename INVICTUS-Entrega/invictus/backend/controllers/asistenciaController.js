const asistenciaService = require('../services/asistenciaService');
const bitacoraService = require('../services/bitacoraService');

const ESTADOS_VALIDOS = ['presente', 'falta', 'tardanza', 'justificado'];

function esFechaFutura(fechaStr) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr + 'T00:00:00');
  return fecha > hoy;
}

const list = async (req, res) => {
  try {
    const { fecha, fecha_inicio, fecha_fin, alumno_id, entrenador_id, estado, tipo_actividad, busqueda } = req.query;
    const filtros = {};
    if (fecha_inicio && fecha_fin) {
      filtros.fecha_inicio = fecha_inicio;
      filtros.fecha_fin = fecha_fin;
    } else if (fecha) {
      filtros.fecha = fecha;
    }
    if (alumno_id) filtros.alumno_id = alumno_id;
    if (entrenador_id) filtros.entrenador_id = entrenador_id;
    if (estado) filtros.estado = estado;
    if (tipo_actividad) filtros.tipo_actividad = tipo_actividad;
    if (busqueda) filtros.busqueda = busqueda;

    const asistencias = await asistenciaService.list(filtros, req.usuario);
    return res.status(200).json({ asistencias });
  } catch (error) {
    console.error('[AsistenciaController:list]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const asistencia = await asistenciaService.getById(id, req.usuario);
    return res.status(200).json({ asistencia });
  } catch (error) {
    if (error.message === 'Asistencia no encontrada') {
      return res.status(404).json({ msg: error.message });
    }
    console.error('[AsistenciaController:getById]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  try {
    const { alumno_id, entrenador_id, horario_id, fecha, estado, observacion } = req.body;
    if (!alumno_id) {
      return res.status(400).json({ msg: 'El alumno es requerido' });
    }
    if (!fecha) {
      return res.status(400).json({ msg: 'La fecha es requerida' });
    }
    if (esFechaFutura(fecha)) {
      return res.status(400).json({ msg: 'No se puede registrar asistencia en una fecha futura' });
    }
    const estadoFinal = estado || 'presente';
    if (!ESTADOS_VALIDOS.includes(estadoFinal)) {
      return res.status(400).json({ msg: 'Estado de asistencia no válido. Use: presente, falta, tardanza o justificado' });
    }
    const asistencia = await asistenciaService.create({
      alumno_id, entrenador_id, horario_id, fecha,
      estado: estadoFinal, observacion,
    }, req.usuario);
    bitacoraService.registrar({
      usuario_id: req.usuario?.id_usuario,
      rol: req.usuario?.rol,
      accion: 'CREATE',
      modulo: 'asistencias',
      descripcion: `Asistencia registrada: alumno ID ${alumno_id}, estado: ${estadoFinal}, fecha: ${fecha}`,
      ip: req.ip,
    });
    return res.status(201).json({ msg: 'Asistencia registrada', asistencia });
  } catch (error) {
    console.error('[AsistenciaController:create]', error);
    if (error.message && (error.message.includes('fecha futura') || error.message.includes('no válido') || error.message.includes('requerido'))) {
      return res.status(400).json({ msg: error.message });
    }
    if (error.message && error.message.includes('permiso')) {
      return res.status(403).json({ msg: error.message });
    }
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.fecha && esFechaFutura(req.body.fecha)) {
      return res.status(400).json({ msg: 'No se puede registrar asistencia en una fecha futura' });
    }
    if (req.body.estado && !ESTADOS_VALIDOS.includes(req.body.estado)) {
      return res.status(400).json({ msg: 'Estado de asistencia no válido. Use: presente, falta, tardanza o justificado' });
    }
    const asistencia = await asistenciaService.update(id, req.body, req.usuario);
    return res.status(200).json({ msg: 'Asistencia actualizada', asistencia });
  } catch (error) {
    if (error.message === 'Asistencia no encontrada') {
      return res.status(404).json({ msg: error.message });
    }
    if (error.message && error.message.includes('permiso')) {
      return res.status(403).json({ msg: error.message });
    }
    console.error('[AsistenciaController:update]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await asistenciaService.remove(id, req.usuario);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Asistencia no encontrada') {
      return res.status(404).json({ msg: error.message });
    }
    if (error.message && error.message.includes('permiso')) {
      return res.status(403).json({ msg: error.message });
    }
    console.error('[AsistenciaController:remove]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

module.exports = { list, getById, create, update, remove };
