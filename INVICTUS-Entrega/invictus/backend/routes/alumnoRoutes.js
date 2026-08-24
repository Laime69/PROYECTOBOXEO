const { Router } = require('express');
const { getPerfil, getHorarios, getAsistencias, getEstadoPago, getDashboard } = require('../controllers/alumnoController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('Alumno'));

router.get('/dashboard', getDashboard);
router.get('/perfil', getPerfil);
router.get('/horarios', getHorarios);
router.get('/asistencias', getAsistencias);
router.get('/pago', getEstadoPago);

module.exports = router;
