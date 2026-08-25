import { useState } from 'react';
import { useTituloPagina } from '../../hooks/useTituloPagina';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../services/usuarioService';
import { asignarTurno } from '../../services/alumnoHorarioService';
import UserRoleFields from '../../components/UserRoleFields';

const PASOS = [
  { num: 1, titulo: 'Cuenta', desc: 'Acceso al sistema' },
  { num: 2, titulo: 'Datos personales', desc: 'Identificación y contacto' },
  { num: 3, titulo: 'Datos del rol', desc: 'Información específica' },
];

function RegisterUser() {
  useTituloPagina('Registrar Usuario');
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
  const [paso, setPaso] = useState(1);
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

  const validarPaso1 = () => {
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validarPaso2 = () => {
    const e = {};
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validarPaso3 = () => {
    const e = {};
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
    setTurnoError('');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const siguiente = () => {
    const valido = paso === 1 ? validarPaso1() : paso === 2 ? validarPaso2() : validarPaso3();
    if (valido) setPaso((p) => Math.min(p + 1, 3));
  };

  const atras = () => {
    setErrors({});
    setPaso((p) => Math.max(p - 1, 1));
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
    if (!validarPaso3()) return;
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
      setSuccess(`"${data.usuario.nombre}" fue registrado correctamente como ${form.rol}`);
      setForm(initialForm);
      setTurnoAsignar('');
      setTurnoError('');
      setPaso(1);
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.errors?.[0] || 'Error al registrar';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#172033]">Registrar Usuario</h2>
        <p className="text-slate-500 mt-1">Completa los 3 pasos para crear un nuevo usuario</p>
      </div>

      {/* ── Indicador de pasos ── */}
      <div className="flex items-center justify-between mb-6 px-2">
        {PASOS.map((p, idx) => {
          const completado = paso > p.num;
          const actual = paso === p.num;
          return (
            <div key={p.num} className={`flex items-center ${idx < PASOS.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => completado && setPaso(p.num)}
                  disabled={!completado}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    completado ? 'bg-green-500 text-white cursor-pointer'
                      : actual ? 'bg-invictus-600 text-white ring-4 ring-invictus-100'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {completado ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : p.num}
                </button>
                <p className={`text-xs mt-1.5 font-semibold whitespace-nowrap ${actual ? 'text-[#172033]' : 'text-gray-400'}`}>{p.titulo}</p>
                <p className="text-[10px] text-gray-400 hidden sm:block">{p.desc}</p>
              </div>
              {idx < PASOS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 mb-6 rounded ${completado ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6 space-y-5" noValidate>
        {paso === 1 && <UserRoleFields seccion="cuenta" mode="create" form={form} onChange={handleChange}
          errors={errors} roleOptions={roleOptions} />}

        {paso === 2 && <UserRoleFields seccion="personal" mode="create" form={form} onChange={handleChange}
          errors={errors} roleOptions={roleOptions} isSuperAdmin={isSuperAdmin} />}

        {paso === 3 && (
          <>
            <div className="flex items-center gap-2 bg-invictus-50 border border-invictus-100 rounded-lg px-3 py-2">
              <span className="text-xs text-invictus-700">
                Registrando a <strong>{form.nombre || '—'}</strong> como <strong>{form.rol}</strong>
              </span>
            </div>
            <UserRoleFields seccion="rol" mode="create" form={form} onChange={handleChange}
              onTurnoChange={handleTurnoChange} errors={errors} roleOptions={roleOptions}
              isSuperAdmin={isSuperAdmin} turnoAsignar={turnoAsignar} turnoError={turnoError} />
          </>
        )}

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
            ✓ {success}
          </div>
        )}

        {/* ── Botones de navegación ── */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={atras}
            disabled={paso === 1 || loading}
            className="px-5 py-2.5 text-sm font-medium text-slate-500 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            ← Atrás
          </button>

          {paso < 3 ? (
            <button
              type="button"
              onClick={siguiente}
              className="px-6 py-2.5 bg-invictus-600 hover:bg-invictus-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Registrando...' : 'Registrar Usuario'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default RegisterUser;
