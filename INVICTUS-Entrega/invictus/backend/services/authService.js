const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const generateJWT = require('../utils/generateJWT');

class AuthService {
  async login(correo, password) {
    const usuario = await Usuario.findByCorreo(correo);
    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      throw new Error('Credenciales inválidas');
    }

    const token = generateJWT({
      id: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
    });

    return {
      token,
      user: {
        id: usuario.id_usuario,
        id_usuario: usuario.id_usuario,
        alumno_id: usuario.alumno_id ?? null,
        id_entrenador: usuario.id_entrenador ?? null,
        id_empleado: usuario.id_empleado ?? null,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }
}

module.exports = new AuthService();
