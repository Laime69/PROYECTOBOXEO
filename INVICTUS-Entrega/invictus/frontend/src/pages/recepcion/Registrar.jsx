import RegistroUsuarioWizard from '../../components/RegistroUsuarioWizard';

const ROLE_OPTIONS_RECEPCION = [
  { value: 'Alumno', label: 'Alumno / Deportista' },
];

function RecepcionRegistrar() {
  return (
    <RegistroUsuarioWizard
      roleOptions={ROLE_OPTIONS_RECEPCION}
      isSuperAdmin={false}
      titulo="Registrar Usuario"
      subtitulo="Completa los 3 pasos para crear un nuevo usuario"
    />
  );
}

export default RecepcionRegistrar;