const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const Alumno = require('../models/Alumno');
const AlumnoHorario = require('../models/AlumnoHorario');
const Horario = require('../models/Horario');
const Pago = require('../models/Pago');
const alumnoHorarioService = require('./alumnoHorarioService');
const pagoService = require('./pagoService');

class UsuarioService {
  async register({ nombre, correo, password, rol, turno, ci, fecha_nacimiento, celular, direccion,
    contacto_emergencia, celular_contacto_emergencia, nivel_deportivo, peso_actual, objetivo_entrenamiento, observacion_medica,
    especialidad, experiencia_anios, fecha_ingreso, estado_laboral, observaciones,
    turno_trabajo, area, cargo, celular_institucional }, currentUser) {
    const existente = await Usuario.findByCorreo(correo);
    if (existente) {
      throw new Error('El correo ya está registrado');
    }

    if (ci && ci.trim()) {
      const existenteCI = await Usuario.findByCI(ci.trim());
      if (existenteCI) {
        throw new Error('La cédula de identidad ya está registrada');
      }
    }

    // Solo SuperAdmin puede crear otro SuperAdmin
    if (rol === 'SuperAdmin' && (!currentUser || currentUser.rol !== 'SuperAdmin')) {
      throw new Error('No tienes permisos para crear un Súper Administrador');
    }

    // Un Administrador no puede crear Administradores
    if (rol === 'Administrador' && currentUser && currentUser.rol !== 'SuperAdmin') {
      throw new Error('No tienes permisos para crear un Administrador');
    }

    // Recepcionista solo puede crear Alumnos
    if (currentUser && currentUser.rol === 'Recepcionista' && rol !== 'Alumno') {
      throw new Error('Solo puedes registrar alumnos');
    }

    // Entrenador no puede registrar usuarios
    if (currentUser && currentUser.rol === 'Entrenador') {
      throw new Error('No tienes permisos para registrar usuarios');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const usuario = await Usuario.create({
      nombre,
      correo,
      password: hashedPassword,
      rol,
      ci,
      fecha_nacimiento,
      celular,
      direccion,
      estado: 'activo',
      contacto_emergencia,
      celular_contacto_emergencia,
      nivel_deportivo,
      peso_actual,
      objetivo_entrenamiento,
      observacion_medica,
      especialidad,
      experiencia_anios,
      fecha_ingreso,
      estado_laboral,
      observaciones,
      turno_trabajo,
      area,
      cargo,
      celular_institucional,
    });

    if (rol === 'Alumno' && turno && usuario.alumno_id) {
      await alumnoHorarioService.asignarPorTurno(usuario.alumno_id, turno);
    }

    return usuario;
  }

  async list(filtros = {}, currentUser) {
    if (typeof filtros === 'string') {
      filtros = { rol: filtros };
    }
    const usuarios = await Usuario.findAll(filtros);
    // Recepcionista y Entrenador solo ven Alumnos
    if (currentUser && (currentUser.rol === 'Recepcionista' || currentUser.rol === 'Entrenador')) {
      return usuarios.filter(u => u.rol === 'Alumno');
    }
    if (filtros.estado_pago) {
      return usuarios.filter(u => u.rol === 'Alumno' && u.estado_pago === filtros.estado_pago);
    }
    return usuarios;
  }

  async getDetalleUsuario(id, currentUser) {
    const usuario = await Usuario.findByIdDetalle(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // SuperAdmin puede ver a todos
    if (currentUser.rol === 'SuperAdmin') {
      return usuario;
    }

    // Admin puede ver a todos excepto SuperAdmin
    if (currentUser.rol === 'Administrador') {
      if (usuario.rol === 'SuperAdmin') {
        throw new Error('No tienes permisos para ver el perfil de un Súper Administrador');
      }
      return usuario;
    }

    // Recepcionista solo puede ver alumnos
    if (currentUser.rol === 'Recepcionista') {
      if (usuario.rol !== 'Alumno') {
        throw new Error('Solo puedes ver el perfil de alumnos');
      }
      return usuario;
    }

    // Entrenador solo puede ver sus alumnos asignados
    if (currentUser.rol === 'Entrenador') {
      if (usuario.rol !== 'Alumno') {
        throw new Error('Solo puedes ver el perfil de tus alumnos');
      }
      // Verificar que el alumno esté asignado a este entrenador
      const alumnoPerfil = await Alumno.findByUsuarioId(id);
      if (!alumnoPerfil) {
        throw new Error('Alumno no encontrado');
      }
      const idAlumno = alumnoPerfil.id_alumno;
      const AlumnoHorario = require('../models/AlumnoHorario');
      const asignado = await AlumnoHorario.findActivoByAlumno(idAlumno);
      if (!asignado || asignado.entrenador_id !== currentUser.id_entrenador) {
        // Verificar a través de los horarios del entrenador
        const Horario = require('../models/Horario');
        const horariosEntrenador = await Horario.findByEntrenador(currentUser.id_entrenador);
        const horarioIds = horariosEntrenador.map(h => h.id_horario);
        const alumnoHorarios = await Promise.all(
          horarioIds.map(async (hid) => {
            try {
              const ah = await AlumnoHorario.findByHorarioAndAlumno(hid, idAlumno);
              return ah;
            } catch {
              return null;
            }
          })
        );
        const estaAsignado = ah => ah && ah.estado === 'activo';
        if (!alumnoHorarios.some(estaAsignado)) {
          throw new Error('Este alumno no está asignado a tus horarios');
        }
      }
      return usuario;
    }

    // Alumno solo puede ver su propio perfil
    if (currentUser.rol === 'Alumno') {
      if (usuario.id_usuario !== currentUser.id_usuario) {
        throw new Error('Solo puedes ver tu propio perfil');
      }
      return usuario;
    }

    throw new Error('No tienes permisos para ver este perfil');
  }

  async getMiPerfil(userId) {
    const usuario = await Usuario.findByIdDetalle(userId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    return usuario;
  }

  async update(id, data, currentUser) {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Solo SuperAdmin puede modificar un SuperAdmin
    if (usuario.rol === 'SuperAdmin' && (!currentUser || currentUser.rol !== 'SuperAdmin')) {
      throw new Error('No tienes permisos para modificar un Súper Administrador');
    }

    // Un Administrador no puede cambiar el rol de un SuperAdmin
    if (data.rol && usuario.rol === 'SuperAdmin' && currentUser && currentUser.rol !== 'SuperAdmin') {
      throw new Error('No puedes cambiar el rol de un Súper Administrador');
    }

    // Entrenador no puede modificar usuarios
    if (currentUser && currentUser.rol === 'Entrenador') {
      throw new Error('No tienes permisos para modificar usuarios');
    }

    // Recepcionista solo puede modificar Alumnos y campos limitados
    if (currentUser && currentUser.rol === 'Recepcionista') {
      if (usuario.rol !== 'Alumno') {
        throw new Error('Solo puedes modificar alumnos');
      }
      // Solo permitir ciertos campos para Recepcionista
      const camposPermitidos = ['nombre', 'correo', 'estado_pago', 'fecha_inscripcion', 'fecha_vencimiento', 'ci', 'fecha_nacimiento', 'celular', 'direccion'];
      const camposNoPermitidos = Object.keys(data).filter(k => !camposPermitidos.includes(k));
      if (camposNoPermitidos.length > 0) {
        throw new Error('No tienes permiso para modificar estos campos');
      }
    }

    // Un Administrador no puede cambiar su propio rol
    if (currentUser && currentUser.rol === 'Administrador' && usuario.id_usuario === currentUser.id_usuario && data.rol && data.rol !== 'Administrador') {
      throw new Error('No puedes cambiar tu propio rol');
    }
    // Un Administrador no puede cambiar el rol de otro Administrador
    if (currentUser && currentUser.rol === 'Administrador' && usuario.rol === 'Administrador' && data.rol && data.rol !== 'Administrador') {
      throw new Error('No puedes cambiar el rol de otro Administrador');
    }
    // Un Administrador no puede asignar el rol SuperAdmin a nadie
    if (currentUser && currentUser.rol === 'Administrador' && data.rol === 'SuperAdmin') {
      throw new Error('No puedes asignar el rol Súper Administrador');
    }

    if (data.correo && data.correo !== usuario.correo) {
      const existente = await Usuario.findByCorreo(data.correo);
      if (existente) {
        throw new Error('El correo ya está registrado');
      }
    }

    if (data.estado_pago === 'vencido') {
      const fechaVen = data.fecha_vencimiento || usuario.fecha_vencimiento;
      if (fechaVen) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const venc = new Date(fechaVen);
        venc.setHours(0, 0, 0, 0);
        if (venc >= hoy) {
          throw new Error('No se puede marcar como vencido porque la fecha de vencimiento aún está vigente.');
        }
      }
    }

    const updated = await Usuario.update(id, data);

    if (usuario.rol === 'Alumno' && (!data.rol || data.rol === 'Alumno')) {
      const camposPago = ['estado_pago', 'fecha_inscripcion', 'fecha_vencimiento'];
      if (camposPago.some(c => data[c] !== undefined)) {
        const alumnoPerfil = await Alumno.findByUsuarioId(id);
        if (alumnoPerfil) {
          await pagoService.sincronizarDesdePerfil(alumnoPerfil.id_alumno, {
            estado_pago: data.estado_pago,
            fecha_inscripcion: data.fecha_inscripcion,
            fecha_vencimiento: data.fecha_vencimiento,
          });
        }
      }
    }

    if ((usuario.rol === 'Alumno' || data.rol === 'Alumno') && data.turno) {
      const alumnoPerfil = await Alumno.findByUsuarioId(id);
      if (!alumnoPerfil) {
        throw new Error('Alumno no encontrado');
      }
      const idAlumno = alumnoPerfil.id_alumno;
      const existente = await AlumnoHorario.findActivoByAlumno(idAlumno);
      if (existente) {
        if (existente.turno !== data.turno && existente.turno_horario !== data.turno) {
          await alumnoHorarioService.cambiarTurno(idAlumno, data.turno);
        }
      } else {
        await alumnoHorarioService.asignarPorTurno(idAlumno, data.turno);
      }
    } else if (data.rol && data.rol !== 'Alumno' && (usuario.rol === 'Alumno' || data.rol === 'Alumno')) {
      const alumnoPerfil = await Alumno.findByUsuarioId(id);
      if (alumnoPerfil) {
        await AlumnoHorario.desactivarByAlumno(alumnoPerfil.id_alumno);
      }
    }

    return updated;
  }

  async remove(id, currentUser) {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Solo SuperAdmin puede eliminar SuperAdmin
    if (usuario.rol === 'SuperAdmin' && (!currentUser || currentUser.rol !== 'SuperAdmin')) {
      throw new Error('No tienes permisos para eliminar un Súper Administrador');
    }

    // Recepcionista y Entrenador no pueden eliminar usuarios
    if (currentUser && (currentUser.rol === 'Recepcionista' || currentUser.rol === 'Entrenador')) {
      throw new Error('No tienes permisos para eliminar usuarios');
    }

    // Un Administrador no puede eliminar a otro Administrador
    if (usuario.rol === 'Administrador' && currentUser && currentUser.rol !== 'SuperAdmin') {
      throw new Error('No tienes permisos para eliminar un Administrador');
    }

    await Usuario.deleteById(id);
    return { message: 'Usuario eliminado correctamente' };
  }

  async getDashboardStats() {
    const stats = await Usuario.countAll();
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();
    const resumenPagos = await Pago.getResumen(mesActual, anioActual);
    const alumnos_pagados = resumenPagos.pagados_mes;
    const ingresos_mes = Math.round(resumenPagos.ingresos_mes * 100) / 100;

    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaActual = diasSemana[new Date().getDay()];
    const es_fin_de_semana = diaActual === 'sabado' || diaActual === 'domingo';
    const es_sparring = diaActual === 'viernes';
    const dia_nombre = diaActual.charAt(0).toUpperCase() + diaActual.slice(1);

    let clases_hoy = { activas: 0, total: 0, texto: 'Sin clases hoy', es_sparring: false };
    let clases_hoy_detalles = [];

    if (!es_fin_de_semana) {
      const horarios = await Horario.findByDia(diaActual);
      const total = horarios.length;
      const activas = horarios.filter(h => h.estado === 'activo').length;
      clases_hoy_detalles = horarios.filter(h => h.estado === 'activo');
      clases_hoy = {
        activas,
        total,
        texto: es_sparring ? `${activas}/${total} sparring` : `${activas}/${total} activas`,
        es_sparring,
      };
    }

    const horarios_semana = await Horario.countAllHorarios();

    return {
      total_usuarios: stats.total,
      total_superadmins: stats.superadmins,
      total_administradores: stats.administradores,
      total_recepcionistas: stats.recepcionistas,
      total_entrenadores: stats.entrenadores,
      total_alumnos: stats.alumnos,
      alumnos_pagados,
      ingresos_mes,
      clases_hoy,
      clases_hoy_detalles,
      dia_nombre,
      es_sparring,
      es_fin_de_semana,
      horarios_semana,
    };
  }
}

module.exports = new UsuarioService();
