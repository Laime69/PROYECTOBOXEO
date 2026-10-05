const Pago = require('../models/Pago');
const Usuario = require('../models/Usuario');
const Alumno = require('../models/Alumno');

const MONTO_MENSUAL = 200;

const esPeriodoFuturo = (mes, anio) => {
  const hoy = new Date();
  return anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes > hoy.getMonth() + 1);
};

class PagoService {
  async list({ mes, anio, estado, turno, busqueda }, currentUser) {
    const hoy = new Date();
    const mesNum = parseInt(mes) || (hoy.getMonth() + 1);
    const anioNum = parseInt(anio) || hoy.getFullYear();

    if (esPeriodoFuturo(mesNum, anioNum)) {
      return { pagos: [], es_futuro: true };
    }

    const pagos = await Pago.findAll({ mes: mesNum, anio: anioNum, estado, turno, busqueda });

    const esMesActual = anioNum === hoy.getFullYear() && mesNum === hoy.getMonth() + 1;

    const registrosDelMes = esMesActual
      ? pagos
      : pagos.filter(p => p.id_pago);

    return {
      es_futuro: false,
      pagos: registrosDelMes.map(p => {
        // Estado del mes: prevalece el registro de la tabla pagos.
        // Sin registro, el perfil solo cuenta como "pagado" si es el mes actual.
        const estado = p.estado_pago
          || (esMesActual && p.estado_actual === 'pagado' ? 'pagado' : 'pendiente');
        return {
          id_pago: p.id_pago,
          alumno_id: p.alumno_id,
          alumno_nombre: p.alumno_nombre,
          alumno_correo: p.alumno_correo,
          turno: p.turno || null,
          mes: mesNum,
          anio: anioNum,
          monto: parseFloat(p.monto) || MONTO_MENSUAL,
          estado,
          fecha_inscripcion: p.fecha_inscripcion,
          fecha_pago: p.fecha_pago,
          fecha_vencimiento: p.fecha_vencimiento || p.fecha_vencimiento_actual,
          metodo_pago: p.metodo_pago || null,
          observacion: p.observacion || null,
        };
      }),
    };
  }

  async marcarPagado(data, currentUser) {
    const { alumno_id, mes, anio, monto, metodo_pago, fecha_pago, observacion } = data;

    if (!alumno_id || !mes || !anio) {
      throw new Error('alumno_id, mes y anio son requeridos');
    }

    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);
    if (mesNum < 1 || mesNum > 12) {
      throw new Error('El mes debe ser un número entre 1 y 12');
    }
    if (anioNum < 2020 || anioNum > 2050) {
      throw new Error('El año no es válido');
    }

    const alumnoExiste = await Pago.existeAlumno(alumno_id);
    if (!alumnoExiste) {
      throw new Error('Alumno no encontrado');
    }

    const montoFinal = monto || MONTO_MENSUAL;
    const fechaPago = fecha_pago || new Date().toISOString().slice(0, 10);
    const fechaVencimiento = new Date(fechaPago);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    const fechaVenStr = fechaVencimiento.toISOString().slice(0, 10);

    const pago = await Pago.crear({
      alumno_id,
      mes: parseInt(mes),
      anio: parseInt(anio),
      monto: montoFinal,
      estado: 'pagado',
      fecha_pago: fechaPago,
      fecha_vencimiento: fechaVenStr,
      metodo_pago: metodo_pago || 'efectivo',
      observacion: observacion || null,
      registrado_por: currentUser.id_usuario,
    });

    await Alumno.updatePago(alumno_id, {
      estado_pago: 'pagado',
      fecha_inscripcion: fechaPago,
      fecha_vencimiento: fechaVenStr,
    });

    return pago;
  }

  async sincronizarDesdePerfil(alumnoId, { estado_pago, fecha_inscripcion, fecha_vencimiento }) {
    const alumno = await Alumno.findById(alumnoId);
    if (!alumno) return null;

    const hayCambioPago = [estado_pago, fecha_inscripcion, fecha_vencimiento].some(v => v !== undefined && v !== null);
    if (!hayCambioPago) return null;

    const hoy = new Date();
    const hoyStr = hoy.toISOString().slice(0, 10);
    const fechaIns = fecha_inscripcion || hoyStr;

    const [aa, mm] = String(fechaIns).split('-').map(Number);
    if (!aa || !mm || isNaN(mm)) return null;
    const mes = mm;
    const anio = aa;
    if (mes < 1 || mes > 12 || anio < 2020 || anio > 2050) return null;

    const estado = estado_pago || 'pendiente';
    const fechaPago = estado === 'pagado' ? (fecha_inscripcion || hoyStr) : null;
    let fechaVen = fecha_vencimiento || null;

    if (estado === 'pagado' && !fechaVen) {
      const v = new Date(fechaPago);
      v.setDate(v.getDate() + 30);
      fechaVen = v.toISOString().slice(0, 10);
    }

    return Pago.upsertDesdePerfil({
      alumno_id: alumnoId,
      mes,
      anio,
      monto: MONTO_MENSUAL,
      estado,
      fecha_pago: fechaPago,
      fecha_vencimiento: fechaVen,
    });
  }

  async actualizarPago(idPago, data) {
    const pago = await Pago.findById(idPago);
    if (!pago) throw new Error('Pago no encontrado');

    if (!pago.alumno_id || pago.alumno_rol !== 'Alumno') {
      throw new Error('Alumno no encontrado');
    }

    const estado = data.estado !== undefined ? data.estado : pago.estado;
    if (!['pagado', 'pendiente', 'vencido'].includes(estado)) {
      throw new Error('El estado no es válido');
    }

    if (data.monto !== undefined) {
      const monto = parseFloat(data.monto);
      if (isNaN(monto) || monto <= 0) {
        throw new Error('El monto debe ser un número mayor a 0');
      }
    }

    if (data.metodo_pago !== undefined && data.metodo_pago !== null && !['efectivo', 'qr', 'transferencia', 'otro'].includes(data.metodo_pago)) {
      throw new Error('El método de pago no es válido');
    }

    const hoyStr = new Date().toISOString().slice(0, 10);

    let fechaPago = data.fecha_pago !== undefined ? (data.fecha_pago || null) : pago.fecha_pago;
    let fechaVen = data.fecha_vencimiento !== undefined ? (data.fecha_vencimiento || null) : pago.fecha_vencimiento;

    for (const f of [fechaPago, fechaVen]) {
      if (f && isNaN(new Date(f).getTime())) {
        throw new Error('La fecha no es válida');
      }
    }

    if (estado === 'pagado') {
      if (!fechaPago) fechaPago = hoyStr;
      if (!fechaVen) {
        const v = new Date(fechaPago);
        v.setDate(v.getDate() + 30);
        fechaVen = v.toISOString().slice(0, 10);
      }
    }

    if (estado === 'vencido' && fechaVen) {
      const vencStr = String(fechaVen).slice(0, 10);
      if (vencStr >= hoyStr) {
        throw new Error('No se puede marcar como vencido porque la fecha de vencimiento aún está vigente.');
      }
    }

    const actualizado = await Pago.updateById(idPago, {
      monto: data.monto !== undefined ? parseFloat(data.monto) : undefined,
      estado,
      fecha_pago: fechaPago,
      fecha_vencimiento: fechaVen,
      metodo_pago: data.metodo_pago !== undefined ? data.metodo_pago : undefined,
      observacion: data.observacion !== undefined ? data.observacion : undefined,
    });

    await this._sincronizarPerfilDesdePago(pago, { estado, fecha_pago: fechaPago, fecha_vencimiento: fechaVen });

    return actualizado;
  }

  async _sincronizarPerfilDesdePago(pago, datos) {
    const alumno = await Alumno.findByUsuarioId(pago.alumno_id);
    if (!alumno) return;

    const [aa, mm] = String(alumno.fecha_inscripcion || '').split('-').map(Number);
    const mesIns = mm >= 1 && mm <= 12 ? mm : null;
    const anioIns = aa >= 2020 && aa <= 2050 ? aa : null;
    const hoy = new Date();

    const esMesVigente = (mesIns && pago.mes === mesIns && pago.anio === anioIns)
      || (pago.mes === hoy.getMonth() + 1 && pago.anio === hoy.getFullYear());
    if (!esMesVigente) return;

    const upd = {
      estado_pago: datos.estado,
      fecha_vencimiento: datos.fecha_vencimiento || null,
    };
    if (datos.estado === 'pagado' && datos.fecha_pago) {
      upd.fecha_inscripcion = String(datos.fecha_pago).slice(0, 10);
    }
    await Alumno.updatePago(alumno.id_alumno, upd);
  }

  async getResumen({ mes, anio }, currentUser) {
    const hoy = new Date();
    const mesNum = parseInt(mes) || (hoy.getMonth() + 1);
    const anioNum = parseInt(anio) || hoy.getFullYear();

    if (esPeriodoFuturo(mesNum, anioNum)) {
      return { resumen: null, es_futuro: true };
    }

    const resumen = await Pago.getResumen(mesNum, anioNum);
    this._ajustarResumenPorMes(resumen, mesNum, anioNum);
    return { resumen, es_futuro: false };
  }

  _ajustarResumenPorMes(resumen, mesNum, anioNum) {
    const hoy = new Date();
    const esMesActual = anioNum === hoy.getFullYear() && mesNum === hoy.getMonth() + 1;
    if (!esMesActual) {
      resumen.total_alumnos = resumen.registros_mes;
      resumen.pendientes_mes = Math.max(
        0,
        resumen.total_alumnos - resumen.pagados_mes - resumen.vencidos
      );
    }
    delete resumen.registros_mes;
  }

  async getHistorial(alumnoId, currentUser) {
    let idAlumno = parseInt(alumnoId, 10);

    if (currentUser.rol === 'Alumno') {
      if (!currentUser.alumno_id) {
        throw new Error('No puedes ver el historial de otro alumno');
      }
      idAlumno = currentUser.alumno_id;
    } else {
      const porUsuario = await Alumno.findByUsuarioId(alumnoId);
      if (porUsuario) {
        idAlumno = porUsuario.id_alumno;
      }
    }

    const historial = await Pago.findByAlumno(idAlumno);

    const perfil = await Alumno.findById(idAlumno);
    const hoy = new Date();
    const fechaInscripcion = perfil?.fecha_inscripcion ? new Date(perfil.fecha_inscripcion) : null;
    const inicioDesdeInscripcion = fechaInscripcion && !isNaN(fechaInscripcion.getTime())
      ? new Date(fechaInscripcion.getFullYear(), fechaInscripcion.getMonth(), 1)
      : null;

    const fechaInicioMes = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
    const mesPrevisto = (inicioDesdeInscripcion && inicioDesdeInscripcion.getTime() > fechaInicioMes.getTime())
      ? inicioDesdeInscripcion
      : fechaInicioMes;

    const mesesPrevistos = [];
    let cursor = mesPrevisto;
    while (cursor <= hoy) {
      mesesPrevistos.push({
        mes: cursor.getMonth() + 1,
        anio: cursor.getFullYear(),
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    const resultado = mesesPrevistos.map(mp => {
      const pago = historial.find(h => h.mes === mp.mes && h.anio === mp.anio);
      return {
        mes: mp.mes,
        anio: mp.anio,
        monto: pago ? pago.monto : null,
        estado: pago ? pago.estado : 'pendiente',
        fecha_pago: pago ? pago.fecha_pago : null,
        metodo_pago: pago ? pago.metodo_pago : null,
        registrado_por_nombre: pago ? pago.registrado_por_nombre : null,
      };
    });

    return resultado;
  }
}

module.exports = new PagoService();
