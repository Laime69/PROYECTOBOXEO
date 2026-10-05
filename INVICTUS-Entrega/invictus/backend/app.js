require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const alumnoRoutes = require('./routes/alumnoRoutes');
const alumnoHorarioRoutes = require('./routes/alumnoHorarioRoutes');
const entrenadorRoutes = require('./routes/entrenadorRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const progresoRoutes = require('./routes/progresoRoutes');
const membresiaRoutes = require('./routes/membresiaRoutes');
const bitacoraRoutes = require('./routes/bitacoraRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/alumno', alumnoRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/progresos', progresoRoutes);
app.use('/api/membresias', membresiaRoutes);
app.use('/api/bitacora', bitacoraRoutes);
app.use('/api', alumnoHorarioRoutes);
app.use('/api/entrenador', entrenadorRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API Academia de Boxeo Invictus' });
});

app.use((req, res) => {
  res.status(404).json({ msg: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error('[ErrorGlobal]', err.message);
  return res.status(500).json({ msg: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
