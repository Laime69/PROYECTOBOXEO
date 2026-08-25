const reporteService = require('../services/reporteService');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const getResumenGeneral = async (req, res) => {
  try {
    const resumen = await reporteService.getResumenGeneral();
    return res.status(200).json({ resumen });
  } catch (error) {
    console.error('[ReporteController:getResumenGeneral]', error);
    return res.status(500).json({ msg: 'Error al cargar el resumen general' });
  }
};

const getAsistenciasPorFecha = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, estado, alumno_id, entrenador_id, horario_id, busqueda } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ msg: 'fecha_inicio y fecha_fin son requeridos' });
    }
    if (!DATE_REGEX.test(fecha_inicio) || !DATE_REGEX.test(fecha_fin)) {
      return res.status(400).json({ msg: 'El formato de fecha debe ser YYYY-MM-DD' });
    }

    const filtros = { fecha_inicio, fecha_fin };
    if (estado) filtros.estado = estado;
    if (alumno_id) filtros.alumno_id = alumno_id;
    if (entrenador_id) filtros.entrenador_id = entrenador_id;
    if (horario_id) filtros.horario_id = horario_id;
    if (busqueda && busqueda.trim()) filtros.busqueda = busqueda.trim();

    const datos = await reporteService.getDetalleAsistencias(filtros);
    return res.status(200).json({ datos });
  } catch (error) {
    console.error('[ReporteController:getAsistenciasPorFecha]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getAsistenciasEntrenador = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    if (fecha_inicio || fecha_fin) {
      if (!DATE_REGEX.test(fecha_inicio) || (fecha_fin && !DATE_REGEX.test(fecha_fin))) {
        return res.status(400).json({ msg: 'El formato de fecha debe ser YYYY-MM-DD' });
      }
    }
    const datos = await reporteService.getAsistenciasEntrenador(
      req.usuario.id_usuario, fecha_inicio || null, fecha_fin || null
    );
    return res.status(200).json({ datos });
  } catch (error) {
    console.error('[ReporteController:getAsistenciasEntrenador]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getResumenPagos = async (req, res) => {
  try {
    const { mes, anio, estado, turno, busqueda } = req.query;
    const hoy = new Date();
    const mesNum = mes ? parseInt(mes, 10) : hoy.getMonth() + 1;
    const anioNum = anio ? parseInt(anio, 10) : hoy.getFullYear();

    if (!Number.isInteger(mesNum) || mesNum < 1 || mesNum > 12) {
      return res.status(400).json({ msg: 'El mes debe estar entre 1 y 12' });
    }
    if (!Number.isInteger(anioNum) || anioNum < 2000 || anioNum > 2100) {
      return res.status(400).json({ msg: 'El año no es válido' });
    }

    const filtros = { mes: mesNum, anio: anioNum };
    if (estado) filtros.estado = estado;
    if (turno) filtros.turno = turno;
    if (busqueda && busqueda.trim()) filtros.busqueda = busqueda.trim();

    const datos = await reporteService.getReportePagos(filtros);
    return res.status(200).json({ datos });
  } catch (error) {
    console.error('[ReporteController:getResumenPagos]', error);
    return res.status(500).json({ msg: 'Error al cargar resumen de pagos' });
  }
};

module.exports = { getResumenGeneral, getAsistenciasPorFecha, getResumenPagos, getAsistenciasEntrenador };
