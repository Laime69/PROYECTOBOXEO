const { Router } = require('express');
const { list, getById, create, update, remove } = require('../controllers/asistenciaController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador'), list);
router.get('/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador'), getById);
router.post('/', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), create);
router.put('/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), update);
router.delete('/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), remove);

module.exports = router;
