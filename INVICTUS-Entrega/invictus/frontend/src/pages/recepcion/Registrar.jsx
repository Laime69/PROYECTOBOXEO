import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/usuarioService';
import { asignarTurno } from '../../services/alumnoHorarioService';

const TURNOS = [
  { key: 'manana', label: 'Mañana', horario: '09:00 - 11:00' },
  { key: 'tarde', label: 'Tarde', horario: '14:00 - 16:00' },
  { key: 'noche', label: 'Noche', horario: '19:00 - 21:00' },
];

const initialForm = {
  nombre: '', correo: '', password: '', confirmPassword: '',
  ci: '', fecha_nacimiento: '', celular: '', direccion: '',
  contacto_emergencia: '', celular_contacto_emergencia: '',
  nivel_deportivo: 'principiante', peso_actual: '',
  objetivo_entrenamiento: '', observacion_medica: '',
};

function RecepcionRegistrar() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [turnoAsignar, setTurnoAsignar] = useState('');
  const [turnoError, setTurnoError] = useState('');
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
    setSuccess('');
  };

  const calcularEdad = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const validateForm = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!form.correo.trim()) {
      errs.correo = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
      errs.correo = 'Formato de correo inválido';
    }
    if (!form.password) {
      errs.password = 'La contraseña es obligatoria';
    } else if (form.password.length < 6) {
      errs.password = 'Mínimo 6 caracteres';
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (!form.ci.trim()) {
      errs.ci = 'La cédula es obligatoria';
    } else if (form.ci.trim().length > 20) {
      errs.ci = 'Máximo 20 caracteres';
    }
    if (!form.fecha_nacimiento) {
      errs.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
    } else if (isNaN(new Date(form.fecha_nacimiento).getTime())) {
      errs.fecha_nacimiento = 'Fecha inválida';
    }
    if (!form.celular.trim()) {
      errs.celular = 'El celular es obligatorio';
    } else if (form.celular.trim().length > 20) {
      errs.celular = 'Máximo 20 caracteres';
    }
    if (!form.direccion.trim()) {
      errs.direccion = 'La dirección es obligatoria';
    } else if (form.direccion.trim().length > 255) {
      errs.direccion = 'Máximo 255 caracteres';
    }
    setFormErrors(errs);
    setTurnoError('');
    if (!turnoAsignar) {
      setTurnoError('Debes seleccionar un turno');
      return false;
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setServerError('');
    setSuccess('');
    try {
      const res = await registerUser({
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        password: form.password,
        rol: 'Alumno',
        ci: form.ci.trim(),
        fecha_nacimiento: form.fecha_nacimiento,
        celular: form.celular.trim(),
        direccion: form.direccion.trim(),
        contacto_emergencia: form.contacto_emergencia.trim(),
        celular_contacto_emergencia: form.celular_contacto_emergencia.trim(),
        nivel_deportivo: form.nivel_deportivo,
        peso_actual: form.peso_actual,
        objetivo_entrenamiento: form.objetivo_entrenamiento.trim(),
        observacion_medica: form.observacion_medica.trim(),
      });
      if (turnoAsignar && res.usuario?.id_usuario) {
        await asignarTurno(res.usuario.id_usuario, turnoAsignar);
      }
      setSuccess(`"${form.nombre}" registrado como alumno`);
      setForm(initialForm);
      setTurnoAsignar('');
      setTurnoError('');
    } catch (err) {
      setServerError(err.response?.data?.msg || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500 ${formErrors[field] ? 'border-red-500' : 'border-gray-300'}`;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Registrar Alumno</h2>
        <p className="text-gray-500 mt-1">Inscribir nuevo alumno en la academia</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
            placeholder="Ej: Juan Pérez" className={inputClass('nombre')} />
          {formErrors.nombre && <p className="mt-1 text-xs text-red-500">{formErrors.nombre}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input type="email" name="correo" value={form.correo} onChange={handleChange}
            placeholder="correo@ejemplo.com" className={inputClass('correo')} />
          {formErrors.correo && <p className="mt-1 text-xs text-red-500">{formErrors.correo}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="Mínimo 6 caracteres" className={inputClass('password')} />
            {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
              placeholder="Repite la contraseña" className={inputClass('confirmPassword')} />
            {formErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{formErrors.confirmPassword}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cédula de Identidad (CI)</label>
          <input type="text" name="ci" value={form.ci} onChange={handleChange}
            placeholder="Ej: 12345678" className={inputClass('ci')} />
          {formErrors.ci && <p className="mt-1 text-xs text-red-500">{formErrors.ci}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
          <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange}
            max={new Date().toISOString().split('T')[0]} className={inputClass('fecha_nacimiento')} />
          {formErrors.fecha_nacimiento && <p className="mt-1 text-xs text-red-500">{formErrors.fecha_nacimiento}</p>}
          {form.fecha_nacimiento && !formErrors.fecha_nacimiento && (
            <p className="mt-1 text-xs text-gray-500">Edad: {calcularEdad(form.fecha_nacimiento)} años</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
            <input type="tel" name="celular" value={form.celular} onChange={handleChange}
              placeholder="Ej: 099123456" className={inputClass('celular')} />
            {formErrors.celular && <p className="mt-1 text-xs text-red-500">{formErrors.celular}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input type="text" name="direccion" value={form.direccion} onChange={handleChange}
              placeholder="Ej: Av. Principal 1234" className={inputClass('direccion')} />
            {formErrors.direccion && <p className="mt-1 text-xs text-red-500">{formErrors.direccion}</p>}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Contacto de Emergencia</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del contacto</label>
              <input type="text" name="contacto_emergencia" value={form.contacto_emergencia} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celular del contacto</label>
              <input type="tel" name="celular_contacto_emergencia" value={form.celular_contacto_emergencia} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos Deportivos</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel deportivo</label>
              <select name="nivel_deportivo" value={form.nivel_deportivo} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500">
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso actual (kg)</label>
              <input type="number" step="0.1" min="0" name="peso_actual" value={form.peso_actual} onChange={handleChange}
                placeholder="Ej: 75.5" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo de entrenamiento</label>
              <input type="text" name="objetivo_entrenamiento" value={form.objetivo_entrenamiento} onChange={handleChange}
                placeholder="Ej: Competencia amateur" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observación médica</label>
              <textarea name="observacion_medica" value={form.observacion_medica} onChange={handleChange} rows={2}
                placeholder="Lesiones, alergias, etc." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Turno de inscripción</h4>
          <p className="text-xs text-gray-400 mb-3">Los viernes corresponden a sparring.</p>
          <div className="space-y-2">
            {TURNOS.map((t) => (
              <label key={t.key}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${turnoAsignar === t.key ? 'border-invictus-500 bg-invictus-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="turno" value={t.key} checked={turnoAsignar === t.key}
                  onChange={(e) => { setTurnoAsignar(e.target.value); setTurnoError(''); }}
                  className="text-invictus-600 focus:ring-invictus-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.label}</p>
                  <p className="text-xs text-gray-400">{t.horario} | Lunes a Viernes</p>
                </div>
              </label>
            ))}
          </div>
          {turnoError && <p className="mt-1 text-xs text-red-500">{turnoError}</p>}
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{serverError}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">{success}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/recepcion/alumnos')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-invictus-600 hover:bg-invictus-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2">
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Registrando...' : 'Registrar Alumno'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecepcionRegistrar;
