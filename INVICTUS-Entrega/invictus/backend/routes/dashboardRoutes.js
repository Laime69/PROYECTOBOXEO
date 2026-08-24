const { Router } = require('express');
const { getStats } = require('../controllers/dashboardController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/stats', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador'), getStats);

module.exports = router;