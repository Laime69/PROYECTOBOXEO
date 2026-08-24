const pagoService = require('../services/pagoService');
const bitacoraService = require('../services/bitacoraService');

const list = async (req, res) => {
  try {
    const { mes, anio, estado, turno, busqueda } = req.query;
    const pagos = await pagoService.list({ mes, anio, estado, turno, busqueda }, req.usuario);
    return res.status(200).json({ pagos });
  } catch (error) {
    console.error('[PagoController:list]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const marcarPagado = async (req, res) => {
  try {
    const { alumno_id, mes, anio, monto, metodo_pago, fecha_pago, observacion } = req.body;
    if (!alumno_id) {
      return res.status(400).json({ msg: 'El alumno es requerido' });
    }
    if (!mes || !anio) {
      return res.status(400).json({ msg: 'El mes y año son requeridos' });
    }
    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);
    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return res.status(400).json({ msg: 'El mes debe ser un número entre 1 y 12' });
    }
    if (isNaN(anioNum) || anioNum < 2020 || anioNum > 2050) {
      return res.status(400).json({ msg: 'El año no es válido' });
    }
    if (monto !== undefined && monto !== null && monto !== '') {
      const montoNum = parseFloat(monto);
      if (isNaN(montoNum) || montoNum <= 0) {
        return res.status(400).json({ msg: 'El monto debe ser un número mayor a 0' });
      }
    }
    if (metodo_pago && !['efectivo', 'qr', 'transferencia', 'otro'].includes(metodo_pago)) {
      return res.status(400).json({ msg: 'El método de pago no es válido. Use: efectivo, qr, transferencia u otro' });
    }
    const pago = await pagoService.marcarPagado({
      alumno_id, mes: mesNum, anio: anioNum, monto, metodo_pago, fecha_pago, observacion,
    }, req.usuario);
    bitacoraService.registrar({
      usuario_id: req.usuario?.id_usuario,
      rol: req.usuario?.rol,
      accion: 'CREATE',
      modulo: 'pagos',
      descripcion: `Pago registrado: alumno ID ${alumno_id}, mes ${mesNum}/${anioNum}, $${monto || 200}`,
      ip: req.ip,
    });
    return res.status(201).json({ msg: 'Pago registrado correctamente', pago });
  } catch (error) {
    if (error.message === 'Alumno no encontrado') {
      return res.status(404).json({ msg: error.message });
    }
    if (error.message && (error.message.includes('requeridos') || error.message.includes('inválido') || error.message.includes('debe ser'))) {
      return res.status(400).json({ msg: error.message });
    }
    console.error('[PagoController:marcarPagado]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const resumen = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const data = await pagoService.getResumen({ mes, anio }, req.usuario);
    return res.status(200).json({ resumen: data });
  } catch (error) {
    console.error('[PagoController:resumen]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const historialAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const historial = await pagoService.getHistorial(id, req.usuario);
    return res.status(200).json({ historial });
  } catch (error) {
    if (error.message === 'No puedes ver el historial de otro alumno') {
      return res.status(403).json({ msg: error.message });
    }
    if (error.message === 'Alumno no encontrado') {
      return res.status(404).json({ msg: error.message });
    }
    console.error('[PagoController:historialAlumno]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

module.exports = { list, marcarPagado, resumen, historialAlumno };
