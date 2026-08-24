const usuarioService = require('../services/usuarioService');

const getStats = async (req, res) => {
  try {
    const stats = await usuarioService.getDashboardStats();
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[DashboardController:getStats]', error);
    return res.status(500).json({ msg: 'Error al cargar estadísticas del dashboard' });
  }
};

module.exports = { getStats };
