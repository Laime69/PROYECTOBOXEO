const usuarioService = require('../services/usuarioService');
const bitacoraService = require('../services/bitacoraService');

const register = async (req, res) => {
  try {
    const { nombre, correo, password, rol, turno, ci, fecha_nacimiento, celular, direccion,
      contacto_emergencia, celular_contacto_emergencia, nivel_deportivo, peso_actual, objetivo_entrenamiento, observacion_medica,
      especialidad, experiencia_anios, fecha_ingreso, estado_laboral, observaciones,
      turno_trabajo, area, cargo, celular_institucional } = req.body;
    const usuario = await usuarioService.register({
      nombre, correo, password, rol, turno, ci, fecha_nacimiento, celular, direccion,
      contacto_emergencia, celular_contacto_emergencia, nivel_deportivo, peso_actual, objetivo_entrenamiento, observacion_medica,
      especialidad, experiencia_anios, fecha_ingreso, estado_laboral, observaciones,
      turno_trabajo, area, cargo, celular_institucional
    }, req.usuario);
    bitacoraService.registrar({
      usuario_id: req.usuario?.id_usuario,
      rol: req.usuario?.rol,
      accion: 'CREATE',
      modulo: 'usuarios',
      descripcion: `Registro de usuario: ${nombre} (${rol})`,
      ip: req.ip,
    });
    return res.status(201).json({
      msg: 'Usuario registrado correctamente',
      usuario,
    });
  } catch (error) {
    const msg = error.message;
    if (msg === 'El correo ya está registrado' || msg.includes('permisos') || msg.includes('Solo puedes') || msg.includes('no puede')) {
      return res.status(400).json({ msg });
    }
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const list = async (req, res) => {
  try {
    const { rol, busqueda, estado, estado_pago } = req.query;
    const filtros = {};
    if (rol) filtros.rol = rol;
    if (busqueda) filtros.busqueda = busqueda;
    if (estado) filtros.estado = estado;
    if (estado_pago) filtros.estado_pago = estado_pago;
    const usuarios = await usuarioService.list(filtros, req.usuario);
    return res.status(200).json({ usuarios });
  } catch (error) {
    console.error('[UsuarioController:list]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const usuario = await usuarioService.update(id, data, req.usuario);
    bitacoraService.registrar({
      usuario_id: req.usuario?.id_usuario,
      rol: req.usuario?.rol,
      accion: 'UPDATE',
      modulo: 'usuarios',
      descripcion: `Actualización de usuario ID ${id}${data.rol ? `, nuevo rol: ${data.rol}` : ''}`,
      ip: req.ip,
    });
    return res.status(200).json({
      msg: 'Usuario actualizado correctamente',
      usuario,
    });
  } catch (error) {
    const msg = error.message;
    if (msg === 'Usuario no encontrado') {
      return res.status(404).json({ msg });
    }
    if (msg.includes('permisos') || msg.includes('No tienes permisos') || msg.includes('No puedes cambiar')) {
      return res.status(403).json({ msg });
    }
    if (msg === 'El correo ya está registrado' || msg.includes('Solo puedes') || msg.includes('No se puede')) {
      return res.status(400).json({ msg });
    }
    console.error('[UsuarioController:update]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await usuarioService.remove(id, req.usuario);
    bitacoraService.registrar({
      usuario_id: req.usuario?.id_usuario,
      rol: req.usuario?.rol,
      accion: 'DELETE',
      modulo: 'usuarios',
      descripcion: `Eliminación de usuario ID ${id}`,
      ip: req.ip,
    });
    return res.status(200).json(result);
  } catch (error) {
    const msg = error.message;
    if (msg === 'Usuario no encontrado') {
      return res.status(404).json({ msg });
    }
    if (msg.includes('permisos') || msg.includes('no puede')) {
      return res.status(403).json({ msg });
    }
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await usuarioService.getDetalleUsuario(id, req.usuario);
    return res.status(200).json({ usuario });
  } catch (error) {
    console.error('Error en getDetalle:', error.message);
    const msg = error.message;
    if (msg === 'Usuario no encontrado') {
      return res.status(404).json({ msg });
    }
    if (msg.includes('permisos') || msg.includes('Solo puedes')) {
      return res.status(403).json({ msg });
    }
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getMiPerfil = async (req, res) => {
  try {
    const usuario = await usuarioService.getMiPerfil(req.usuario.id_usuario);
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    return res.status(200).json({ usuario });
  } catch (error) {
    console.error('[UsuarioController:getMiPerfil]', error.message);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

module.exports = { register, list, update, remove, getDetalle, getMiPerfil };
