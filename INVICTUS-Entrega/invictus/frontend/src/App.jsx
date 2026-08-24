import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import RegisterUser from './pages/admin/RegisterUser';
import ManageUsers from './pages/admin/ManageUsers';
import Alumnos from './pages/admin/Alumnos';
import Entrenadores from './pages/admin/Entrenadores';
import Pagos from './pages/admin/Pagos';
import Asistencias from './pages/admin/Asistencias';
import Horarios from './pages/admin/Horarios';
import Reportes from './pages/admin/Reportes';
import AdminProgreso from './pages/admin/Progreso';
import Bitacora from './pages/admin/Bitacora';
import EntrenadorDashboard from './pages/entrenador/Dashboard';
import MisHorarios from './pages/entrenador/MisHorarios';
import MisAlumnos from './pages/entrenador/MisAlumnos';
import EntrenadorAsistencias from './pages/entrenador/Asistencias';
import EntrenadorReportes from './pages/entrenador/Reportes';
import EntrenadorProgreso from './pages/entrenador/Progreso';
import AlumnoDashboard from './pages/alumno/Dashboard';
import AlumnoPerfil from './pages/alumno/Perfil';
import AlumnoHorarios from './pages/alumno/Horarios';
import AlumnoAsistencias from './pages/alumno/Asistencias';
import AlumnoPago from './pages/alumno/Pago';
import AlumnoProgreso from './pages/alumno/Progreso';
import RecepcionDashboard from './pages/recepcion/Dashboard';
import RecepcionRegistrar from './pages/recepcion/Registrar';
import RecepcionAlumnos from './pages/recepcion/Alumnos';
import RecepcionPagos from './pages/recepcion/Pagos';
import RecepcionHorarios from './pages/recepcion/Horarios';
import RecepcionAsistencias from './pages/recepcion/Asistencias';
import RecepcionReportes from './pages/recepcion/Reportes';
import ProtectedRoute from './components/ProtectedRoute';
import MiPerfil from './pages/shared/MiPerfil';

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['SuperAdmin', 'Administrador']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="register" element={<RegisterUser />} />
        <Route path="manage" element={<ManageUsers />} />
        <Route path="alumnos" element={<Alumnos />} />
        <Route path="entrenadores" element={<Entrenadores />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="asistencias" element={<Asistencias />} />
        <Route path="horarios" element={<Horarios />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="progreso" element={<AdminProgreso />} />
        <Route path="bitacora" element={<Bitacora />} />
        <Route path="perfil" element={<MiPerfil />} />
      </Route>

      <Route
        path="/recepcion"
        element={
          <ProtectedRoute rol="Recepcionista">
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RecepcionDashboard />} />
        <Route path="registrar" element={<RecepcionRegistrar />} />
        <Route path="alumnos" element={<RecepcionAlumnos />} />
        <Route path="pagos" element={<RecepcionPagos />} />
        <Route path="horarios" element={<RecepcionHorarios />} />
        <Route path="asistencias" element={<RecepcionAsistencias />} />
        <Route path="reportes" element={<RecepcionReportes />} />
        <Route path="perfil" element={<MiPerfil />} />
      </Route>

      <Route
        path="/entrenador"
        element={
          <ProtectedRoute rol="Entrenador">
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EntrenadorDashboard />} />
        <Route path="horarios" element={<MisHorarios />} />
        <Route path="alumnos" element={<MisAlumnos />} />
        <Route path="asistencias" element={<EntrenadorAsistencias />} />
        <Route path="reportes" element={<EntrenadorReportes />} />
        <Route path="progreso" element={<EntrenadorProgreso />} />
        <Route path="perfil" element={<MiPerfil />} />
      </Route>

      <Route
        path="/alumno"
        element={
          <ProtectedRoute rol="Alumno">
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AlumnoDashboard />} />
        <Route path="perfil" element={<MiPerfil />} />
        <Route path="horarios" element={<AlumnoHorarios />} />
        <Route path="asistencias" element={<AlumnoAsistencias />} />
        <Route path="pago" element={<AlumnoPago />} />
        <Route path="progreso" element={<AlumnoProgreso />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;