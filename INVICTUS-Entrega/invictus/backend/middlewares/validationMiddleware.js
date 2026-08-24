const validateLoginInput = (req, res, next) => {
  const { correo, password } = req.body;
  const errors = [];

  if (!correo || !correo.trim()) {
    errors.push('El correo es obligatorio');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
      errors.push('El formato del correo no es válido');
    }
  }

  if (!password || !password.trim()) {
    errors.push('La contraseña es obligatoria');
  } else if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (errors.length > 0) {
    return res.status(400).json({ msg: 'Error de validación', errors });
  }

  next();
};

const validateRegisterInput = (req, res, next) => {
  const { nombre, correo, password, rol, ci, fecha_nacimiento, celular, direccion } = req.body;
  const errors = [];

  if (!nombre || !nombre.trim()) {
    errors.push('El nombre es obligatorio');
  }

  if (!correo || !correo.trim()) {
    errors.push('El correo es obligatorio');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
      errors.push('El formato del correo no es válido');
    }
  }

  if (!password || !password.trim()) {
    errors.push('La contraseña es obligatoria');
  } else if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  const rolesPermitidos = ['Alumno', 'Entrenador', 'Recepcionista'];
  if (req.usuario && (req.usuario.rol === 'SuperAdmin' || req.usuario.rol === 'Administrador')) {
    rolesPermitidos.push('Administrador');
  }
  if (req.usuario && req.usuario.rol === 'SuperAdmin') {
    rolesPermitidos.push('SuperAdmin');
  }
  if (!rol || !rolesPermitidos.includes(rol)) {
    errors.push('El rol seleccionado no es válido');
  }

  if (!ci || !ci.trim()) {
    errors.push('La cédula de identidad es obligatoria');
  } else if (ci.trim().length > 20) {
    errors.push('La cédula no puede tener más de 20 caracteres');
  }

  if (!fecha_nacimiento) {
    errors.push('La fecha de nacimiento es obligatoria');
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fecha_nacimiento)) {
      errors.push('El formato de la fecha de nacimiento no es válido');
    } else {
      const date = new Date(fecha_nacimiento);
      if (isNaN(date.getTime())) {
        errors.push('La fecha de nacimiento no es válida');
      } else {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaNac = new Date(fecha_nacimiento + 'T00:00:00');
        if (fechaNac > hoy) {
          errors.push('La fecha de nacimiento no puede ser una fecha futura');
        }
      }
    }
  }

  if (!celular || !celular.trim()) {
    errors.push('El celular es obligatorio');
  } else if (celular.trim().length > 20) {
    errors.push('El celular no puede tener más de 20 caracteres');
  }

  if (!direccion || !direccion.trim()) {
    errors.push('La dirección es obligatoria');
  } else if (direccion.trim().length > 255) {
    errors.push('La dirección no puede tener más de 255 caracteres');
  }

  if (rol === 'Alumno') {
    const { turno } = req.body;
    if (!turno || !['manana', 'tarde', 'noche'].includes(turno)) {
      errors.push('El turno es obligatorio para alumnos (manana, tarde, noche)');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ msg: 'Error de validación', errors });
  }

  next();
};

const validateUpdateInput = (req, res, next) => {
  const { nombre, correo, password, rol, estado_pago, fecha_inscripcion, fecha_vencimiento, ci, fecha_nacimiento, celular, direccion } = req.body;
  const errors = [];

  if (nombre !== undefined && nombre !== null && !String(nombre).trim()) {
    errors.push('El nombre no puede estar vacío');
  }

  if (correo !== undefined && correo !== null) {
    if (!String(correo).trim()) {
      errors.push('El correo no puede estar vacío');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(correo).trim())) {
        errors.push('El formato del correo no es válido');
      }
    }
  }

  if (password !== undefined && password !== null && String(password).trim() && String(password).length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (rol !== undefined) {
    const rolesPermitidos = ['SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno'];
    if (!rolesPermitidos.includes(rol)) {
      errors.push('El rol no es válido');
    }
    if (rol === 'Alumno' && req.body.turno !== undefined && !['manana', 'tarde', 'noche'].includes(req.body.turno)) {
      errors.push('El turno debe ser manana, tarde o noche');
    }
  }

  if (req.body.turno && !['manana', 'tarde', 'noche'].includes(req.body.turno)) {
    errors.push('El turno debe ser manana, tarde o noche');
  }

  if (estado_pago !== undefined && !['pendiente', 'pagado', 'vencido'].includes(estado_pago)) {
    errors.push('El estado de pago no es válido');
  }

  if (estado_pago === 'vencido' && req.body.fecha_vencimiento) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(req.body.fecha_vencimiento + 'T00:00:00');
    if (venc >= hoy) {
      errors.push('No se puede marcar como vencido porque la fecha de vencimiento aún está vigente');
    }
  }

  if (ci !== undefined && ci !== null) {
    if (!String(ci).trim()) {
      errors.push('La cédula de identidad no puede estar vacía');
    } else if (String(ci).trim().length > 20) {
      errors.push('La cédula no puede tener más de 20 caracteres');
    }
  }

  if (fecha_nacimiento !== undefined) {
    if (!fecha_nacimiento) {
      errors.push('La fecha de nacimiento no puede estar vacía');
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fecha_nacimiento)) {
        errors.push('El formato de la fecha de nacimiento no es válido');
      } else {
        const date = new Date(fecha_nacimiento);
        if (isNaN(date.getTime())) {
          errors.push('La fecha de nacimiento no es válida');
        } else {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          const fechaNac = new Date(fecha_nacimiento + 'T00:00:00');
          if (fechaNac > hoy) {
            errors.push('La fecha de nacimiento no puede ser una fecha futura');
          }
        }
      }
    }
  }

  if (celular !== undefined && celular !== null) {
    if (!String(celular).trim()) {
      errors.push('El celular no puede estar vacío');
    } else if (String(celular).trim().length > 20) {
      errors.push('El celular no puede tener más de 20 caracteres');
    }
  }

  if (direccion !== undefined && direccion !== null) {
    if (!String(direccion).trim()) {
      errors.push('La dirección no puede estar vacía');
    } else if (String(direccion).trim().length > 255) {
      errors.push('La dirección no puede tener más de 255 caracteres');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ msg: 'Error de validación', errors });
  }

  next();
};

module.exports = { validateLoginInput, validateRegisterInput, validateUpdateInput };
