const authService = require('../services/authService');
const bitacoraService = require('../services/bitacoraService');

const login = async (req, res) => {
  try {
    const { correo, password } = req.body || {};
    if (!correo || !password) {
      return res.status(400).json({ msg: 'El correo y la contraseña son obligatorios' });
    }
    const result = await authService.login(correo.trim(), password);
    if (result && result.user) {
      bitacoraService.registrar({
        usuario_id: result.user.id_usuario,
        rol: result.user.rol,
        accion: 'LOGIN',
        modulo: 'auth',
        descripcion: `Inicio de sesión: ${result.user.nombre}`,
        ip: req.ip,
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Credenciales inválidas') {
      return res.status(401).json({ msg: error.message });
    }
    console.error('[AuthController:login]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const perfil = async (req, res) => {
  try {
    return res.status(200).json({ usuario: req.usuario });
  } catch (error) {
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

module.exports = { login, perfil };
