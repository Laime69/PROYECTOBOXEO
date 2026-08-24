const reporteService = require('../services/reporteService');

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
    const { fecha_inicio, fecha_fin } = req.query;
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ msg: 'fecha_inicio y fecha_fin son requeridos' });
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fecha_inicio) || !dateRegex.test(fecha_fin)) {
      return res.status(400).json({ msg: 'El formato de fecha debe ser YYYY-MM-DD' });
    }
    const datos = await reporteService.getAsistenciasPorFecha(fecha_inicio, fecha_fin);
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
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fecha_inicio) || (fecha_fin && !dateRegex.test(fecha_fin))) {
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
    const resumen = await reporteService.getResumenPagos();
    return res.status(200).json({ resumen });
  } catch (error) {
    console.error('[ReporteController:getResumenPagos]', error);
    return res.status(500).json({ msg: 'Error al cargar resumen de pagos' });
  }
};

module.exports = { getResumenGeneral, getAsistenciasPorFecha, getResumenPagos, getAsistenciasEntrenador };
