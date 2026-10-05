import { useState, useEffect } from 'react';
import { updateUser } from '../services/usuarioService';
import { asignarTurno, getHorarioActual } from '../services/alumnoHorarioService';

const TURNOS = [
  { key: 'manana', label: 'Mañana', horario: '09:00 - 11:00' },
  { key: 'tarde', label: 'Tarde', horario: '14:00 - 16:00' },
  { key: 'noche', label: 'Noche', horario: '19:00 - 21:00' },
];

const NIVELES_DEPORTIVOS = [
  { key: 'principiante', label: 'Principiante' },
  { key: 'intermedio', label: 'Intermedio' },
  { key: 'avanzado', label: 'Avanzado' },
];

const inputBase = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500';
const inputOk = 'border-gray-300';
const inputErr = 'border-red-500';

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  if (isNaN(nac.getTime())) return null;
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

function Seccion({ titulo, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{titulo}</h4>
      {children}
    </div>
  );
}

function Control({ label, error, className = '', children }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-500 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function ModalEditarAlumno({ alumno, onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre: '', correo: '', password: '', confirmPassword: '',
    ci: '', fecha_nacimiento: '', celular: '', direccion: '',
    contacto_emergencia: '', celular_contacto_emergencia: '',
    nivel_deportivo: 'principiante', peso_actual: '', objetivo_entrenamiento: '', observacion_medica: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [turnoAsignar, setTurnoAsignar] = useState('');
  const [turnoInicial, setTurnoInicial] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!alumno) return;
    setForm({
      nombre: alumno.nombre || '',
      correo: alumno.correo || '',
      password: '',
      confirmPassword: '',
      ci: alumno.ci || '',
      fecha_nacimiento: alumno.fecha_nacimiento ? alumno.fecha_nacimiento.slice(0, 10) : '',
      celular: alumno.celular || '',
      direccion: alumno.direccion || '',
      contacto_emergencia: alumno.contacto_emergencia || '',
      celular_contacto_emergencia: alumno.celular_contacto_emergencia || '',
      nivel_deportivo: alumno.nivel_deportivo || 'principiante',
      peso_actual: alumno.peso_actual || '',
      objetivo_entrenamiento: alumno.objetivo_entrenamiento || '',
      observacion_medica: alumno.observacion_medica || '',
    });
    setFormErrors({});
    getHorarioActual(alumno.alumno_id)
      .then((res) => {
        const t = res?.horario?.turno || res?.horario?.turno_horario || '';
        setTurnoAsignar(t);
        setTurnoInicial(t);
      })
      .catch(() => {
        setTurnoAsignar('');
        setTurnoInicial('');
      });
  }, [alumno]);

  const setCampo = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setFormErrors((e) => ({ ...e, [campo]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!form.correo.trim()) errs.correo = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) errs.correo = 'Formato inválido';
    if (form.password && form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (form.password && form.password !== form.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
    if (!form.ci.trim()) errs.ci = 'La cédula es obligatoria';
    else if (form.ci.trim().length > 20) errs.ci = 'Máximo 20 caracteres';
    if (!form.fecha_nacimiento) errs.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
    else if (isNaN(new Date(form.fecha_nacimiento).getTime())) errs.fecha_nacimiento = 'Fecha inválida';
    if (!form.celular.trim()) errs.celular = 'El celular es obligatorio';
    else if (form.celular.trim().length > 20) errs.celular = 'Máximo 20 caracteres';
    if (!form.direccion.trim()) errs.direccion = 'La dirección es obligatoria';
    else if (form.direccion.trim().length > 255) errs.direccion = 'Máximo 255 caracteres';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setCargando(true);
    try {
      const data = {};
      if (form.nombre.trim() !== alumno.nombre) data.nombre = form.nombre.trim();
      if (form.correo.trim() !== alumno.correo) data.correo = form.correo.trim();
      if (form.password.trim()) data.password = form.password;
      if (form.ci.trim() !== (alumno.ci || '')) data.ci = form.ci.trim();
      if (form.fecha_nacimiento !== (alumno.fecha_nacimiento?.slice(0, 10) || '')) data.fecha_nacimiento = form.fecha_nacimiento;
      if (form.celular.trim() !== (alumno.celular || '')) data.celular = form.celular.trim();
      if (form.direccion.trim() !== (alumno.direccion || '')) data.direccion = form.direccion.trim();
      if (form.contacto_emergencia.trim() !== (alumno.contacto_emergencia || '')) data.contacto_emergencia = form.contacto_emergencia.trim();
      if (form.celular_contacto_emergencia.trim() !== (alumno.celular_contacto_emergencia || '')) data.celular_contacto_emergencia = form.celular_contacto_emergencia.trim();
      if (form.nivel_deportivo !== (alumno.nivel_deportivo || 'principiante')) data.nivel_deportivo = form.nivel_deportivo;
      if (form.peso_actual !== (alumno.peso_actual || '')) data.peso_actual = form.peso_actual;
      if (form.objetivo_entrenamiento.trim() !== (alumno.objetivo_entrenamiento || '')) data.objetivo_entrenamiento = form.objetivo_entrenamiento.trim();
      if (form.observacion_medica.trim() !== (alumno.observacion_medica || '')) data.observacion_medica = form.observacion_medica.trim();

      const turnoCambio = turnoAsignar && turnoAsignar !== turnoInicial;
      if (Object.keys(data).length === 0 && !turnoCambio) {
        onClose();
        return;
      }

      if (Object.keys(data).length > 0) {
        await updateUser(alumno.id_usuario, data);
      }
      if (turnoCambio) {
        await asignarTurno(alumno.alumno_id, turnoAsignar);
      }

      onGuardado?.(`"${form.nombre.trim()}" actualizado correctamente`);
      onClose();
    } catch (err) {
      setFormErrors({});
      setFormErrors({ _general: err.response?.data?.msg || 'Error al guardar los cambios' });
    } finally {
      setCargando(false);
    }
  };

  const edad = calcularEdad(form.fecha_nacimiento);

  return (
    <div className="fixed inset-0 bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-invictus-100 text-invictus-700 rounded-full flex items-center justify-center text-lg font-bold">
              {form.nombre.charAt(0).toUpperCase() || alumno.nombre?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#172033]">Editar Alumno</h3>
              <p className="text-xs text-slate-500">{alumno.nombre}{alumno.ci ? ` · CI ${alumno.ci}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-[#172033] text-2xl leading-none transition-colors">&times;</button>
        </div>

        {formErrors._general && (
          <div className="px-6 pt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{formErrors._general}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <Seccion titulo="Datos personales">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Control label="Nombre completo" error={formErrors.nombre} className="sm:col-span-2">
                  <input
                    type="text" value={form.nombre}
                    onChange={(e) => setCampo('nombre', e.target.value)}
                    className={`${inputBase} ${formErrors.nombre ? inputErr : inputOk}`}
                  />
                </Control>
                <Control label="Correo electrónico" error={formErrors.correo}>
                  <input
                    type="email" value={form.correo}
                    onChange={(e) => setCampo('correo', e.target.value)}
                    className={`${inputBase} ${formErrors.correo ? inputErr : inputOk}`}
                  />
                </Control>
                <Control label="Contraseña" error={formErrors.password}>
                  <input
                    type="password" value={form.password} placeholder="Dejar vacío para no cambiar"
                    onChange={(e) => setCampo('password', e.target.value)}
                    className={`${inputBase} ${formErrors.password ? inputErr : inputOk}`}
                  />
                </Control>
                <Control label="Cédula de Identidad (CI)" error={formErrors.ci}>
                  <input
                    type="text" value={form.ci}
                    onChange={(e) => setCampo('ci', e.target.value)}
                    className={`${inputBase} ${formErrors.ci ? inputErr : inputOk}`}
                  />
                </Control>
                <Control label="Confirmar contraseña" error={formErrors.confirmPassword}>
                  <input
                    type="password" value={form.confirmPassword}
                    onChange={(e) => setCampo('confirmPassword', e.target.value)}
                    className={`${inputBase} ${formErrors.confirmPassword ? inputErr : inputOk}`}
                  />
                </Control>
                <Control label="Fecha de nacimiento" error={formErrors.fecha_nacimiento}>
                  <input
                    type="date" value={form.fecha_nacimiento}
                    onChange={(e) => setCampo('fecha_nacimiento', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={`${inputBase} ${formErrors.fecha_nacimiento ? inputErr : inputOk}`}
                  />
                  {form.fecha_nacimiento && !formErrors.fecha_nacimiento && edad != null && (
                    <p className="mt-1 text-xs text-slate-500">Edad: {edad} años</p>
                  )}
                </Control>
                <Control label="Celular" error={formErrors.celular}>
                  <input
                    type="tel" value={form.celular}
                    onChange={(e) => setCampo('celular', e.target.value)}
                    className={`${inputBase} ${formErrors.celular ? inputErr : inputOk}`}
                  />
                </Control>
                <Control label="Dirección" error={formErrors.direccion} className="sm:col-span-2">
                  <input
                    type="text" value={form.direccion}
                    onChange={(e) => setCampo('direccion', e.target.value)}
                    className={`${inputBase} ${formErrors.direccion ? inputErr : inputOk}`}
                  />
                </Control>
              </div>
            </Seccion>

            <Seccion titulo="Contacto de emergencia">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Control label="Nombre del contacto">
                  <input
                    type="text" value={form.contacto_emergencia}
                    onChange={(e) => setCampo('contacto_emergencia', e.target.value)}
                    className={`${inputBase} ${inputOk}`}
                  />
                </Control>
                <Control label="Celular del contacto">
                  <input
                    type="tel" value={form.celular_contacto_emergencia}
                    onChange={(e) => setCampo('celular_contacto_emergencia', e.target.value)}
                    className={`${inputBase} ${inputOk}`}
                  />
                </Control>
              </div>
            </Seccion>

            <Seccion titulo="Datos deportivos">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Control label="Nivel deportivo">
                  <select
                    value={form.nivel_deportivo}
                    onChange={(e) => setCampo('nivel_deportivo', e.target.value)}
                    className={`${inputBase} ${inputOk} bg-white`}
                  >
                    {NIVELES_DEPORTIVOS.map((n) => (
                      <option key={n.key} value={n.key}>{n.label}</option>
                    ))}
                  </select>
                </Control>
                <Control label="Peso actual (kg)">
                  <input
                    type="number" value={form.peso_actual}
                    onChange={(e) => setCampo('peso_actual', e.target.value)}
                    step="0.1" min="0"
                    className={`${inputBase} ${inputOk}`}
                  />
                </Control>
                <Control label="Objetivo de entrenamiento" className="sm:col-span-2">
                  <input
                    type="text" value={form.objetivo_entrenamiento}
                    onChange={(e) => setCampo('objetivo_entrenamiento', e.target.value)}
                    className={`${inputBase} ${inputOk}`}
                  />
                </Control>
                <Control label="Observación médica" className="sm:col-span-2">
                  <textarea
                    value={form.observacion_medica}
                    onChange={(e) => setCampo('observacion_medica', e.target.value)}
                    rows={2}
                    className={`${inputBase} ${inputOk} resize-none`}
                  />
                </Control>
              </div>
            </Seccion>

            <Seccion titulo="Asignación de turno">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TURNOS.map((t) => (
                  <label key={t.key} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${turnoAsignar === t.key ? 'border-invictus-500 bg-invictus-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <input
                      type="radio" name="turno" value={t.key}
                      checked={turnoAsignar === t.key}
                      onChange={(e) => setTurnoAsignar(e.target.value)}
                      className="text-invictus-600 focus:ring-invictus-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#172033]">{t.label}</p>
                      <p className="text-xs text-gray-400">{t.horario} | Lunes a Viernes</p>
                    </div>
                  </label>
                ))}
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${turnoAsignar === '' ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <input
                    type="radio" name="turno" value=""
                    checked={turnoAsignar === ''}
                    onChange={(e) => setTurnoAsignar('')}
                    className="text-slate-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Sin turno</p>
                  </div>
                </label>
              </div>
            </Seccion>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={cargando}
              className="bg-invictus-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-invictus-700 disabled:opacity-60 transition-colors">
              {cargando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEditarAlumno;