const progresoService = require('../services/progresoService');

const list = async (req, res) => {
  try {
    const registros = await progresoService.list(req.query, req.usuario);
    return res.status(200).json({ progresos: registros || [] });
  } catch (error) {
    console.error('[ProgresoController:list]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  try {
    const { alumno_id } = req.body || {};
    if (!alumno_id) {
      return res.status(400).json({ msg: 'El alumno es requerido' });
    }
    const progreso = await progresoService.create(req.body, req.usuario);
    return res.status(201).json({ progreso, msg: 'Evaluación registrada correctamente' });
  } catch (error) {
    if (error.message && error.message.includes('No puedes')) {
      return res.status(403).json({ msg: error.message });
    }
    if (error.message && (error.message.includes('requerido') || error.message.includes('inválido') || error.message.includes('debe ser') || error.message.includes('entre 1 y 10'))) {
      return res.status(400).json({ msg: error.message });
    }
    console.error('[ProgresoController:create]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ msg: 'ID de evaluación inválido' });
    }
    const progreso = await progresoService.update(id, req.body, req.usuario);
    if (!progreso) return res.status(404).json({ msg: 'Evaluación no encontrada' });
    return res.status(200).json({ progreso, msg: 'Evaluación actualizada correctamente' });
  } catch (error) {
    if (error.message && error.message.includes('No puedes')) {
      return res.status(403).json({ msg: error.message });
    }
    if (error.message === 'Evaluación no encontrada') {
      return res.status(404).json({ msg: error.message });
    }
    console.error('[ProgresoController:update]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getHistorial = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ msg: 'ID de alumno inválido' });
    }
    const registros = await progresoService.getHistorial(id, req.usuario);
    return res.status(200).json({ historial: registros || [] });
  } catch (error) {
    if (error.message.includes('No puedes')) {
      return res.status(403).json({ msg: error.message });
    }
    console.error('[ProgresoController:getHistorial]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getMisProgresos = async (req, res) => {
  try {
    const data = await progresoService.getMisProgresos(req.usuario);
    return res.status(200).json({ progresos: data.progresos || [] });
  } catch (error) {
    console.error('[ProgresoController:getMisProgresos]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getResumen = async (req, res) => {
  try {
    const data = await progresoService.getResumen(req.query, req.usuario);
    return res.status(200).json({ resumen: data.resumen || null });
  } catch (error) {
    console.error('[ProgresoController:getResumen]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

module.exports = { list, create, update, getHistorial, getMisProgresos, getResumen };
