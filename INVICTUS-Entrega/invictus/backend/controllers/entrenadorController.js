const entrenadorService = require('../services/entrenadorService');

const getMisHorarios = async (req, res) => {
  try {
    const horarios = await entrenadorService.getMisHorarios(req.usuario.id_usuario);
    return res.status(200).json({ horarios: horarios || [] });
  } catch (error) {
    console.error('[EntrenadorController:getMisHorarios]', error);
    return res.status(500).json({ msg: 'Error al cargar horarios. Intente nuevamente.' });
  }
};

const getMisAlumnos = async (req, res) => {
  try {
    const alumnos = await entrenadorService.getMisAlumnos(req.usuario.id_usuario);
    return res.status(200).json({ alumnos: alumnos || [] });
  } catch (error) {
    console.error('[EntrenadorController:getMisAlumnos]', error);
    return res.status(500).json({ msg: 'Error al cargar alumnos. Intente nuevamente.' });
  }
};

module.exports = { getMisHorarios, getMisAlumnos };
