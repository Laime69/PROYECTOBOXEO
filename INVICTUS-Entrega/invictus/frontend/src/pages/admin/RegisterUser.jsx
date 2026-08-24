import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../services/usuarioService';
import { asignarTurno } from '../../services/alumnoHorarioService';
import UserRoleFields from '../../components/UserRoleFields';

function RegisterUser() {
  const { user } = useAuth();
  const isSuperAdmin = user?.rol === 'SuperAdmin';

  const initialForm = {
    nombre: '', correo: '', password: '', confirmPassword: '', rol: 'Alumno',
    ci: '', fecha_nacimiento: '', celular: '', direccion: '', estado: 'activo',
    estado_pago: 'pendiente', fecha_inscripcion: '', fecha_vencimiento: '',
    nivel_deportivo: 'principiante', peso_actual: '', objetivo_entrenamiento: '', observacion_medica: '',
    especialidad: '', experiencia_anios: '', fecha_ingreso: '', estado_laboral: 'activo', observaciones: '',
    turno_trabajo: '', area: '',
    cargo: '', celular_institucional: '',
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnoAsignar, setTurnoAsignar] = useState('');
  const [turnoError, setTurnoError] = useState('');

  const roleOptions = isSuperAdmin
    ? [
        { value: 'Alumno', label: 'Alumno / Deportista' },
        { value: 'Entrenador', label: 'Entrenador' },
        { value: 'Recepcionista', label: 'Recepción / Cajero' },
        { value: 'Administrador', label: 'Administrador' },
        { value: 'SuperAdmin', label: 'Súper Administrador' },
      ]
    : [
        { value: 'Alumno', label: 'Alumno / Deportista' },
        { value: 'Entrenador', label: 'Entrenador' },
        { value: 'Recepcionista', label: 'Recepción / Cajero' },
      ];

  const validateForm = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!form.correo.trim()) {
      e.correo = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
      e.correo = 'Formato de correo inválido';
    }
    if (!form.password) {
      e.password = 'La contraseña es obligatoria';
    } else if (form.password.length < 6) {
      e.password = 'Mínimo 6 caracteres';
    }
    if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (!form.ci.trim()) {
      e.ci = 'La cédula de identidad es obligatoria';
    } else if (form.ci.trim().length > 20) {
      e.ci = 'Máximo 20 caracteres';
    }
    if (!form.fecha_nacimiento) {
      e.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
    } else if (isNaN(new Date(form.fecha_nacimiento).getTime())) {
      e.fecha_nacimiento = 'Fecha inválida';
    }
    if (!form.celular.trim()) {
      e.celular = 'El celular es obligatorio';
    } else if (form.celular.trim().length > 20) {
      e.celular = 'Máximo 20 caracteres';
    }
    if (!form.direccion.trim()) {
      e.direccion = 'La dirección es obligatoria';
    } else if (form.direccion.trim().length > 255) {
      e.direccion = 'Máximo 255 caracteres';
    }

    const rol = form.rol;
    if (rol === 'Alumno') {
      if (!turnoAsignar) {
        setTurnoError('Debes seleccionar un turno para el alumno');
        setErrors(e);
        return false;
      }
      if (!form.fecha_inscripcion) e.fecha_inscripcion = 'La fecha de inscripción es obligatoria';
    } else if (rol === 'Entrenador') {
      if (!form.especialidad.trim()) e.especialidad = 'La especialidad es obligatoria';
    } else if (rol === 'Recepcionista') {
      if (!form.turno_trabajo) e.turno_trabajo = 'El turno de trabajo es obligatorio';
      if (!form.area.trim()) e.area = 'El área es obligatoria';
    } else if (rol === 'Administrador') {
      if (!form.cargo.trim()) e.cargo = 'El cargo es obligatorio';
    }

    setErrors(e);
    setTurnoError('');
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'rol') {
      setTurnoAsignar('');
      setTurnoError('');
    }
    setServerError('');
    setSuccess('');
  };

  const handleTurnoChange = (value) => {
    setTurnoAsignar(value);
    setTurnoError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setServerError('');
    setSuccess('');

    try {
      const payload = {
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        password: form.password,
        rol: form.rol,
        ci: form.ci.trim(),
        fecha_nacimiento: form.fecha_nacimiento,
        celular: form.celular.trim(),
        direccion: form.direccion.trim(),
        estado: form.estado || 'activo',
      };

      if (form.rol === 'Alumno') {
        payload.turno = turnoAsignar;
        payload.fecha_inscripcion = form.fecha_inscripcion;
        payload.estado_pago = form.estado_pago;
        payload.fecha_vencimiento = form.fecha_vencimiento;
        payload.nivel_deportivo = form.nivel_deportivo;
        payload.peso_actual = form.peso_actual;
        payload.objetivo_entrenamiento = form.objetivo_entrenamiento;
        payload.observacion_medica = form.observacion_medica;
      } else if (form.rol === 'Entrenador') {
        payload.especialidad = form.especialidad.trim();
        payload.experiencia_anios = form.experiencia_anios;
        payload.fecha_ingreso = form.fecha_ingreso;
        payload.estado_laboral = form.estado_laboral;
        payload.observaciones = form.observaciones;
      } else if (form.rol === 'Recepcionista') {
        payload.turno_trabajo = form.turno_trabajo;
        payload.area = form.area.trim();
        payload.fecha_ingreso = form.fecha_ingreso;
        payload.estado_laboral = form.estado_laboral;
        payload.observaciones = form.observaciones;
      } else if (form.rol === 'Administrador') {
        payload.cargo = form.cargo.trim();
        payload.celular_institucional = form.celular_institucional;
        payload.fecha_ingreso = form.fecha_ingreso;
        payload.estado_laboral = form.estado_laboral;
        payload.observaciones = form.observaciones;
      } else if (form.rol === 'SuperAdmin') {
        payload.cargo = form.cargo.trim();
        payload.celular_institucional = form.celular_institucional;
        payload.fecha_ingreso = form.fecha_ingreso;
        payload.observaciones = form.observaciones;
      }

      const data = await registerUser(payload);
      if (form.rol === 'Alumno' && turnoAsignar && data.usuario?.id_usuario) {
        await asignarTurno(data.usuario.id_usuario, turnoAsignar);
      }
      setSuccess(`"${data.usuario.nombre}" registrado como ${form.rol}`);
      setForm(initialForm);
      setTurnoAsignar('');
      setTurnoError('');
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.errors?.[0] || 'Error al registrar';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Registrar Usuario</h2>
        <p className="text-gray-500 mt-1">Crea un nuevo usuario en el sistema</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5" noValidate>
        <UserRoleFields
          mode="create"
          form={form}
          onChange={handleChange}
          onTurnoChange={handleTurnoChange}
          errors={errors}
          roleOptions={roleOptions}
          isSuperAdmin={isSuperAdmin}
          turnoAsignar={turnoAsignar}
          turnoError={turnoError}
        />

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-invictus-600 hover:bg-invictus-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Registrando...' : 'Registrar Usuario'}
        </button>
      </form>
    </div>
  );
}

export default RegisterUser;
