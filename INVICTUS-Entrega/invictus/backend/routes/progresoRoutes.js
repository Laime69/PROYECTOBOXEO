const { Router } = require('express');
const { list, create, update, getHistorial, getMisProgresos, getResumen } = require('../controllers/progresoController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), list);
router.post('/', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), create);
router.put('/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), update);

router.get('/mis-progresos', roleMiddleware('Alumno'), getMisProgresos);

router.get('/alumno/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador', 'Alumno'), getHistorial);

router.get('/reportes/resumen', roleMiddleware('SuperAdmin', 'Administrador'), getResumen);

module.exports = router;
