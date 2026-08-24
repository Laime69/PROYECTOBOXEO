const alumnoService = require('../services/alumnoService');

const getPerfil = async (req, res) => {
  try {
    const perfil = await alumnoService.getPerfil(req.usuario.id_usuario);
    if (!perfil) {
      return res.status(404).json({ msg: 'Perfil no encontrado' });
    }
    return res.status(200).json({ perfil });
  } catch (error) {
    if (error.message === 'Usuario no encontrado') {
      return res.status(404).json({ msg: error.message });
    }
    console.error('[AlumnoController:getPerfil]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getHorarios = async (req, res) => {
  try {
    const horarios = await alumnoService.getHorarios(req.usuario.id_usuario);
    return res.status(200).json({ horarios });
  } catch (error) {
    console.error('[AlumnoController:getHorarios]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getAsistencias = async (req, res) => {
  try {
    const { fecha } = req.query;
    const filtros = {};
    if (fecha) filtros.fecha = fecha;
    const asistencias = await alumnoService.getAsistencias(req.usuario.id_usuario, filtros);
    return res.status(200).json({ asistencias });
  } catch (error) {
    console.error('[AlumnoController:getAsistencias]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getEstadoPago = async (req, res) => {
  try {
    const pago = await alumnoService.getEstadoPago(req.usuario.id_usuario);
    return res.status(200).json({ pago });
  } catch (error) {
    console.error('[AlumnoController:getEstadoPago]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const dashboard = await alumnoService.getDashboard(req.usuario.id_usuario);
    return res.status(200).json({ dashboard });
  } catch (error) {
    console.error('[AlumnoController:getDashboard]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

module.exports = { getPerfil, getHorarios, getAsistencias, getEstadoPago, getDashboard };
