const { Router } = require('express');
const { grilla, list, getById, create, update, remove } = require('../controllers/horarioController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/grilla', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador'), grilla);
router.get('/', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador'), list);
router.get('/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador'), getById);
router.post('/', roleMiddleware('SuperAdmin', 'Administrador'), create);
router.put('/:id', roleMiddleware('SuperAdmin', 'Administrador'), update);
router.delete('/:id', roleMiddleware('SuperAdmin', 'Administrador'), remove);

module.exports = router;
