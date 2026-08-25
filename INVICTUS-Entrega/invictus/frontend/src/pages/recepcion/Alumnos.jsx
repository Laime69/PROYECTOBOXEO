import { useState, useEffect } from 'react';
import { getUsers, updateUser } from '../../services/usuarioService';
import { asignarTurno, getHorarioActual } from '../../services/alumnoHorarioService';
import UserDetailModal from '../../components/UserDetailModal';
import ActionButton from '../../components/ActionButton';

const TURNOS = [
  { key: 'manana', label: 'Mañana', horario: '09:00 - 11:00' },
  { key: 'tarde', label: 'Tarde', horario: '14:00 - 16:00' },
  { key: 'noche', label: 'Noche', horario: '19:00 - 21:00' },
];

const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

const getTurnoLabel = (turno) => {
  return NOMBRES_TURNO[turno] || turno || '—';
};

function RecepcionAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);

  const [form, setForm] = useState({
    nombre: '', correo: '', password: '', confirmPassword: '',
    ci: '', fecha_nacimiento: '', celular: '', direccion: '',
    contacto_emergencia: '', celular_contacto_emergencia: '',
    nivel_deportivo: 'principiante', peso_actual: '', objetivo_entrenamiento: '', observacion_medica: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [turnoAsignar, setTurnoAsignar] = useState('');
  const [viewUserId, setViewUserId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');

  useEffect(() => {
    if (!error) return undefined;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!success) return undefined;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  // autodismiss-ok
  const fetchAlumnos = async () => {
    setLoading(true);
    try {
      const data = await getUsers('Alumno');
      const alumnosConTurno = await Promise.all(
        data.usuarios.map(async (a) => {
          try {
            const res = await getHorarioActual(a.id_usuario);
            return { ...a, turno: res?.turno || res?.turno_horario || '—' };
          } catch {
            return { ...a, turno: '—' };
          }
        })
      );
      setAlumnos(alumnosConTurno);
    } catch {
      setError('Error al cargar alumnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumnos();
  }, []);

  const alumnosFiltrados = alumnos.filter((a) => {
    if (filtroTurno) {
      const turnoAlumno = a.turno && NOMBRES_TURNO[a.turno] ? a.turno : '';
      if (turnoAlumno !== filtroTurno) return false;
    }
    if (busqueda.trim()) {
      const term = busqueda.trim().toLowerCase();
      const texto = `${a.nombre || ''} ${a.correo || ''} ${a.ci || ''} ${a.celular || ''}`.toLowerCase();
      if (!texto.includes(term)) return false;
    }
    return true;
  });

  const resetForm = () => {
    setForm({
      nombre: '', correo: '', password: '', confirmPassword: '',
      ci: '', fecha_nacimiento: '', celular: '', direccion: '',
      contacto_emergencia: '', celular_contacto_emergencia: '',
      nivel_deportivo: 'principiante', peso_actual: '', objetivo_entrenamiento: '', observacion_medica: '',
    });
    setFormErrors({});
    setTurnoAsignar('');
    setEditando(null);
  };

  const openEdit = async (a) => {
    setEditando(a);
    setForm({
      nombre: a.nombre,
      correo: a.correo,
      password: '',
      confirmPassword: '',
      ci: a.ci || '',
      fecha_nacimiento: a.fecha_nacimiento ? a.fecha_nacimiento.slice(0, 10) : '',
      celular: a.celular || '',
      direccion: a.direccion || '',
      contacto_emergencia: a.contacto_emergencia || '',
      celular_contacto_emergencia: a.celular_contacto_emergencia || '',
      nivel_deportivo: a.nivel_deportivo || 'principiante',
      peso_actual: a.peso_actual || '',
      objetivo_entrenamiento: a.objetivo_entrenamiento || '',
      observacion_medica: a.observacion_medica || '',
    });
    setFormErrors({});
    try {
      const res = await getHorarioActual(a.id_usuario);
      setTurnoAsignar(res?.turno || res?.turno_horario || '');
    } catch {
      setTurnoAsignar('');
    }
    setShowForm(true);
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
    try {
      if (editando) {
        const data = {};
        if (form.nombre.trim() !== editando.nombre) data.nombre = form.nombre.trim();
        if (form.correo.trim() !== editando.correo) data.correo = form.correo.trim();
        if (form.password.trim()) data.password = form.password;
        if (form.ci.trim() !== (editando.ci || '')) data.ci = form.ci.trim();
        if (form.fecha_nacimiento !== (editando.fecha_nacimiento?.slice(0, 10) || '')) data.fecha_nacimiento = form.fecha_nacimiento;
        if (form.celular.trim() !== (editando.celular || '')) data.celular = form.celular.trim();
        if (form.direccion.trim() !== (editando.direccion || '')) data.direccion = form.direccion.trim();
        if (form.contacto_emergencia.trim() !== (editando.contacto_emergencia || '')) data.contacto_emergencia = form.contacto_emergencia.trim();
        if (form.celular_contacto_emergencia.trim() !== (editando.celular_contacto_emergencia || '')) data.celular_contacto_emergencia = form.celular_contacto_emergencia.trim();
        if (form.nivel_deportivo !== (editando.nivel_deportivo || 'principiante')) data.nivel_deportivo = form.nivel_deportivo;
        if (form.peso_actual !== (editando.peso_actual || '')) data.peso_actual = form.peso_actual;
        if (form.objetivo_entrenamiento.trim() !== (editando.objetivo_entrenamiento || '')) data.objetivo_entrenamiento = form.objetivo_entrenamiento.trim();
        if (form.observacion_medica.trim() !== (editando.observacion_medica || '')) data.observacion_medica = form.observacion_medica.trim();
        if (Object.keys(data).length === 0) { setShowForm(false); return; }
        await updateUser(editando.id_usuario, data);
        if (turnoAsignar) {
          await asignarTurno(editando.id_usuario, turnoAsignar);
        }
        setSuccess(`"${form.nombre}" actualizado`);
      }
      setShowForm(false);
      resetForm();
      fetchAlumnos();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al guardar');
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#172033]">Alumnos</h2>
          <p className="text-slate-500 mt-1">Consultar alumnos registrados</p>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">{success}</div>}

      {/* ── Barra de filtros ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4 mb-5">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <div className="flex-1 min-w-[230px]">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Buscar alumno</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, correo, CI o celular..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Turno</label>
            <select value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500 ${filtroTurno ? 'border-invictus-400 text-invictus-700 font-medium' : 'border-gray-300'}`}>
              <option value="">Todos</option>
              {Object.entries(NOMBRES_TURNO).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {(busqueda || filtroTurno) && (
            <div>
              <span className="block text-xs font-semibold text-transparent uppercase tracking-wide mb-1 select-none">.</span>
              <button
                onClick={() => { setBusqueda(''); setFiltroTurno(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
        {(busqueda || filtroTurno) && (
          <p className="text-xs text-gray-400 mt-3">Mostrando {alumnosFiltrados.length} de {alumnos.length} alumnos</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : alumnos.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No hay alumnos registrados</div>
        ) : alumnosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No hay alumnos que coincidan con los filtros</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">CI</th>
                <th className="px-4 py-3 font-semibold">Celular</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Turno</th>
                <th className="px-4 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {alumnosFiltrados.map((a) => (
                <tr key={a.id_usuario} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-[#172033]">{a.nombre}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{a.ci || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{a.celular || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{a.correo}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{getTurnoLabel(a.turno)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionButton tipo="ver" onClick={() => setViewUserId(a.id_usuario)} />
                      <ActionButton tipo="editar" onClick={() => openEdit(a)} titulo={`Editar a ${a.nombre}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-bold text-[#172033] mb-4">
              {editando ? 'Editar Alumno' : 'Editar Alumno'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Nombre completo</label>
                <input
                  type="text" name="nombre" value={form.nombre}
                  onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFormErrors({ ...formErrors, nombre: '' }); }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Correo electrónico</label>
                <input
                  type="email" name="correo" value={form.correo}
                  onChange={(e) => { setForm({ ...form, correo: e.target.value }); setFormErrors({ ...formErrors, correo: '' }); }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.correo ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.correo && <p className="text-xs text-red-500 mt-1">{formErrors.correo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Contraseña <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>
                </label>
                <input
                  type="password" name="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Cédula de Identidad (CI)</label>
                <input
                  type="text" name="ci" value={form.ci}
                  onChange={(e) => { setForm({ ...form, ci: e.target.value }); setFormErrors({ ...formErrors, ci: '' }); }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.ci ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.ci && <p className="text-xs text-red-500 mt-1">{formErrors.ci}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Fecha de Nacimiento</label>
                <input
                  type="date" name="fecha_nacimiento" value={form.fecha_nacimiento}
                  onChange={(e) => { setForm({ ...form, fecha_nacimiento: e.target.value }); setFormErrors({ ...formErrors, fecha_nacimiento: '' }); }}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.fecha_nacimiento && <p className="text-xs text-red-500 mt-1">{formErrors.fecha_nacimiento}</p>}
                {form.fecha_nacimiento && !formErrors.fecha_nacimiento && (
                  <p className="mt-1 text-xs text-slate-500">
                    Edad: {(() => {
                      const hoy = new Date();
                      const nac = new Date(form.fecha_nacimiento);
                      let edad = hoy.getFullYear() - nac.getFullYear();
                      const mes = hoy.getMonth() - nac.getMonth();
                      if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
                        edad--;
                      }
                      return edad;
                    })()} años
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Celular</label>
                <input
                  type="tel" name="celular" value={form.celular}
                  onChange={(e) => { setForm({ ...form, celular: e.target.value }); setFormErrors({ ...formErrors, celular: '' }); }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.celular ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.celular && <p className="text-xs text-red-500 mt-1">{formErrors.celular}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Dirección</label>
                <input
                  type="text" name="direccion" value={form.direccion}
                  onChange={(e) => { setForm({ ...form, direccion: e.target.value }); setFormErrors({ ...formErrors, direccion: '' }); }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.direccion ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.direccion && <p className="text-xs text-red-500 mt-1">{formErrors.direccion}</p>}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Contacto de Emergencia</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Nombre del contacto</label>
                    <input
                      type="text" name="contacto_emergencia" value={form.contacto_emergencia}
                      onChange={(e) => setForm({ ...form, contacto_emergencia: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Celular del contacto</label>
                    <input
                      type="tel" name="celular_contacto_emergencia" value={form.celular_contacto_emergencia}
                      onChange={(e) => setForm({ ...form, celular_contacto_emergencia: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos Deportivos</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Nivel deportivo</label>
                    <select
                      name="nivel_deportivo" value={form.nivel_deportivo}
                      onChange={(e) => setForm({ ...form, nivel_deportivo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="principiante">Principiante</option>
                      <option value="intermedio">Intermedio</option>
                      <option value="avanzado">Avanzado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Peso actual (kg)</label>
                    <input
                      type="number" name="peso_actual" value={form.peso_actual}
                      onChange={(e) => setForm({ ...form, peso_actual: e.target.value })}
                      step="0.1" min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Objetivo de entrenamiento</label>
                    <input
                      type="text" name="objetivo_entrenamiento" value={form.objetivo_entrenamiento}
                      onChange={(e) => setForm({ ...form, objetivo_entrenamiento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Observación médica</label>
                    <textarea
                      name="observacion_medica" value={form.observacion_medica}
                      onChange={(e) => setForm({ ...form, observacion_medica: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-2">
                  {TURNOS.map((t) => (
                    <label key={t.key} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${turnoAsignar === t.key ? 'border-invictus-500 bg-invictus-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="turno"
                        value={t.key}
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
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${turnoAsignar === '' ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="turno"
                      value=""
                      checked={turnoAsignar === ''}
                      onChange={(e) => setTurnoAsignar('')}
                      className="text-slate-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Sin turno</p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-[#172033]">Cancelar</button>
                <button type="submit"
                  className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewUserId && (
        <UserDetailModal userId={viewUserId} onClose={() => setViewUserId(null)} />
      )}
    </div>
  );
}

export default RecepcionAlumnos;
