const { Router } = require('express');
const { login, perfil } = require('../controllers/authController');
const { validateLoginInput } = require('../middlewares/validationMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.post('/login', validateLoginInput, login);
router.get('/perfil', authMiddleware, perfil);

module.exports = router;
