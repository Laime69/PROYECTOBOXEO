const { Router } = require('express');
const { list, getByAlumno, getMia, update, renovar } = require('../controllers/membresiaController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/mia', roleMiddleware('Alumno'), getMia);
router.get('/alumno/:alumnoId/renovar', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), renovar);
router.patch('/alumno/:alumnoId', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), update);
router.post('/alumno/:alumnoId/renovar', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), renovar);
router.get('/alumno/:alumnoId', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador'), getByAlumno);
router.get('/', roleMiddleware('SuperAdmin', 'Administrador'), list);

module.exports = router;