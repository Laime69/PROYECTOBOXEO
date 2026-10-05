const { Router } = require('express');
const { asignarHorario, asignarTurno, cambiarHorario, cambiarTurno, getHorarioActual, getHorarios, getAlumnosByHorario, getAlumnosByTurno } = require('../controllers/alumnoHorarioController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);

router.post('/alumnos/:id/asignar-horario', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), asignarHorario);
router.post('/alumnos/:id/asignar-turno', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), asignarTurno);
router.post('/alumnos/:id/cambiar-horario', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), cambiarHorario);
router.post('/alumnos/:id/cambiar-turno', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista'), cambiarTurno);
router.get('/alumnos/:id/horario-actual', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno'), getHorarioActual);
router.get('/alumnos/:id/horarios', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno'), getHorarios);
router.get('/horarios/:id/alumnos', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador'), getAlumnosByHorario);
router.get('/turnos/:turno/alumnos', roleMiddleware('SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador'), getAlumnosByTurno);

module.exports = router;
