const { Router } = require('express');
const { list, marcarPagado, resumen, historialAlumno } = require('../controllers/pagoController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), list);
router.post('/marcar-pagado', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), marcarPagado);
router.get('/resumen', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), resumen);
router.get('/alumno/:id/historial', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Alumno'), historialAlumno);

module.exports = router;
