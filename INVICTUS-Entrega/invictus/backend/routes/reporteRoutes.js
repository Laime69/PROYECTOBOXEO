const { Router } = require('express');
const { getResumenGeneral, getAsistenciasPorFecha, getResumenPagos, getAsistenciasEntrenador } = require('../controllers/reporteController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/general', roleMiddleware('SuperAdmin', 'Administrador'), getResumenGeneral);
router.get('/asistencias', roleMiddleware('SuperAdmin', 'Administrador'), getAsistenciasPorFecha);
router.get('/pagos', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), getResumenPagos);
router.get('/entrenador', roleMiddleware('Entrenador'), getAsistenciasEntrenador);

module.exports = router;
