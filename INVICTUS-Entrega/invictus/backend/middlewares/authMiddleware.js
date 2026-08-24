const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ msg: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'invictus_jwt_secret_key_2024'
    );

    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) {
      return res.status(401).json({ msg: 'Token inválido - usuario no existe' });
    }

    if (usuario.estado && usuario.estado === 'inactivo') {
      return res.status(401).json({ msg: 'Su cuenta ha sido desactivada. Contacte al administrador.' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ msg: 'Token inválido o expirado' });
  }
};

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario || !req.usuario.rol) {
      return res.status(401).json({ msg: 'No autenticado' });
    }
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ msg: 'Acceso denegado - rol no autorizado' });
    }
    next();
  };
};

const adminMiddleware = roleMiddleware('SuperAdmin', 'Administrador');
const superAdminMiddleware = roleMiddleware('SuperAdmin');
const recepcionistaMiddleware = roleMiddleware('Recepcionista');

module.exports = { authMiddleware, roleMiddleware, adminMiddleware, superAdminMiddleware, recepcionistaMiddleware };
