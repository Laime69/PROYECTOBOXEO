const { Router } = require('express');
const { register, list, update, remove, getDetalle, getMiPerfil } = require('../controllers/usuarioController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');
const { validateRegisterInput, validateUpdateInput } = require('../middlewares/validationMiddleware');

const router = Router();

router.use(authMiddleware);

router.post('/', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), validateRegisterInput, register);
router.get('/', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador'), list);
router.get('/me', getMiPerfil);
router.get('/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno'), getDetalle);
router.put('/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), validateUpdateInput, update);
router.delete('/:id', roleMiddleware('SuperAdmin', 'Administrador'), remove);

module.exports = router;