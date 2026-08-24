const Bitacora = require('../models/Bitacora');

class BitacoraService {
  async registrar({ usuario_id, rol, accion, modulo, descripcion, ip }) {
    try {
      return await Bitacora.registrar({ usuario_id, rol, accion, modulo, descripcion, ip });
    } catch (error) {
      console.error('[BitacoraService] Error al registrar acción:', error.message);
      return null;
    }
  }

  async listar(filtros) {
    return await Bitacora.findAll(filtros);
  }
}

module.exports = new BitacoraService();
