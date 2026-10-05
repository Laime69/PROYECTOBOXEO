import { useAuth } from '../../context/AuthContext';
import RegistroUsuarioWizard from '../../components/RegistroUsuarioWizard';

const ROLE_OPTIONS_SUPER_ADMIN = [
  { value: 'Alumno', label: 'Alumno / Deportista' },
  { value: 'Entrenador', label: 'Entrenador' },
  { value: 'Recepcionista', label: 'Recepción / Cajero' },
  { value: 'Administrador', label: 'Administrador' },
  { value: 'SuperAdmin', label: 'Súper Administrador' },
];

const ROLE_OPTIONS_ADMIN = [
  { value: 'Alumno', label: 'Alumno / Deportista' },
  { value: 'Entrenador', label: 'Entrenador' },
  { value: 'Recepcionista', label: 'Recepción / Cajero' },
];

function RegisterUser() {
  const { user } = useAuth();
  const isSuperAdmin = user?.rol === 'SuperAdmin';

  return (
    <RegistroUsuarioWizard
      roleOptions={isSuperAdmin ? ROLE_OPTIONS_SUPER_ADMIN : ROLE_OPTIONS_ADMIN}
      isSuperAdmin={isSuperAdmin}
      titulo="Registrar Usuario"
      subtitulo="Completa los 3 pasos para crear un nuevo usuario"
    />
  );
}

export default RegisterUser;