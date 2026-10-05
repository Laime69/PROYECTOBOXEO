const { Router } = require('express');
const {
  list,
  listarAlumnos,
  getById,
  create,
  update,
  remove,
  getHistorial,
  getPerfilProgreso,
  getGraficosData,
  getMisProgresos,
  getResumen,
  comparar,
} = require('../controllers/progresoController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);

// Listado general de evaluaciones (sin los nuevos campos de detalle por alumno)
router.get('/', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), list);

// PERFIL de alumno y gráficos — declarar ANTES de /:id para evitar colisiones
router.get('/alumno/:id/perfil', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador', 'Alumno'), getPerfilProgreso);
router.get('/alumno/:id/graficos', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador', 'Alumno'), getGraficosData);
router.get('/alumno/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador', 'Alumno'), getHistorial);

router.get('/mis-progresos', roleMiddleware('Alumno'), getMisProgresos);

router.get('/reportes/resumen', roleMiddleware('SuperAdmin', 'Administrador'), getResumen);

// Lista de alumnos con su último progreso (para la tabla principal)
router.get('/alumnos', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), listarAlumnos);

// Comparar dos evaluaciones
router.post('/comparar', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), comparar);

// Cerraremos las rutas de detalle/operaciones al final para no chocar con /alumno y /reportes
router.get('/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador', 'Alumno'), getById);
router.post('/', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), create);
router.put('/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), update);
router.delete('/:id', roleMiddleware('SuperAdmin', 'Administrador', 'Entrenador'), remove);

module.exports = router;
