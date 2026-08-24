const bitacoraService = require('../services/bitacoraService');

const listar = async (req, res) => {
  try {
    const { usuario_id, rol, modulo, accion, fecha_desde, fecha_hasta, busqueda, limite } = req.query;
    const filtros = {};
    if (usuario_id) filtros.usuario_id = parseInt(usuario_id);
    if (rol) filtros.rol = rol;
    if (modulo) filtros.modulo = modulo;
    if (accion) filtros.accion = accion;
    if (fecha_desde) filtros.fecha_desde = fecha_desde;
    if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;
    if (busqueda) filtros.busqueda = busqueda;
    if (limite) filtros.limite = limite;

    const registros = await bitacoraService.listar(filtros);
    return res.status(200).json({ bitacora: registros });
  } catch (error) {
    console.error('[BitacoraController:listar]', error);
    return res.status(500).json({ msg: 'Error al cargar bitácora' });
  }
};

module.exports = { listar };
