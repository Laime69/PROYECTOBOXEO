const { Router } = require('express');
const { getMisHorarios, getMisAlumnos } = require('../controllers/entrenadorController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('Entrenador'));

router.get('/mis-horarios', getMisHorarios);
router.get('/mis-alumnos', getMisAlumnos);

module.exports = router;
