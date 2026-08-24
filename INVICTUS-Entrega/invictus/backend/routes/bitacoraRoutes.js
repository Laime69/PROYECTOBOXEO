const express = require('express');
const router = express.Router();
const { authMiddleware, superAdminMiddleware } = require('../middlewares/authMiddleware');
const { listar } = require('../controllers/bitacoraController');

router.get('/', authMiddleware, superAdminMiddleware, listar);

module.exports = router;
