const Pago = require('../models/Pago');
const Usuario = require('../models/Usuario');

const MONTO_MENSUAL = 200;

class PagoService {
  async list({ mes, anio, estado, turno, busqueda }, currentUser) {
    const mesNum = parseInt(mes) || (new Date().getMonth() + 1);
    const anioNum = parseInt(anio) || new Date().getFullYear();

    const pagos = await Pago.findAll({ mes: mesNum, anio: anioNum, estado, turno, busqueda });

    return pagos.map(p => ({
      id_pago: p.id_pago,
      alumno_id: p.alumno_id,
      alumno_nombre: p.alumno_nombre,
      alumno_correo: p.alumno_correo,
      turno: p.turno || null,
      mes: mesNum,
      anio: anioNum,
      monto: parseFloat(p.monto) || MONTO_MENSUAL,
      estado: p.estado_pago || (p.estado_actual === 'pagado' ? 'pagado' : 'pendiente'),
      fecha_inscripcion: p.fecha_inscripcion,
      fecha_pago: p.fecha_pago,
      fecha_vencimiento: p.fecha_vencimiento || p.fecha_vencimiento_actual,
      metodo_pago: p.metodo_pago || null,
      observacion: p.observacion || null,
    }));
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

    const alumno = await Usuario.findById(alumno_id);
    if (!alumno || alumno.rol !== 'Alumno') {
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

    await Usuario.update(alumno_id, {
      estado_pago: 'pagado',
      fecha_inscripcion: fechaPago,
      fecha_vencimiento: fechaVenStr,
    });

    return pago;
  }

  async getResumen({ mes, anio }, currentUser) {
    const mesNum = parseInt(mes) || (new Date().getMonth() + 1);
    const anioNum = parseInt(anio) || new Date().getFullYear();

    return await Pago.getResumen(mesNum, anioNum);
  }

  async getHistorial(alumnoId, currentUser) {
    if (currentUser.rol === 'Alumno' && currentUser.id_usuario !== parseInt(alumnoId)) {
      throw new Error('No puedes ver el historial de otro alumno');
    }

    const historial = await Pago.findByAlumno(alumnoId);

    const mesesPrevistos = [];
    if (historial.length > 0) {
      const hoy = new Date();
      for (let i = 0; i < 12; i++) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        mesesPrevistos.push({
          mes: fecha.getMonth() + 1,
          anio: fecha.getFullYear(),
        });
      }
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
