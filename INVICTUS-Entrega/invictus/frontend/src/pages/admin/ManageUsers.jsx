import { useState, useEffect } from 'react';
import { useTituloPagina } from '../../hooks/useTituloPagina';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUsers, updateUser, deleteUser } from '../../services/usuarioService';
import { marcarPagado } from '../../services/pagoService';
import { asignarTurno, cambiarTurno, getHorarioActual } from '../../services/alumnoHorarioService';
import UserDetailModal from '../../components/UserDetailModal';
import UserRoleFields from '../../components/UserRoleFields';
import Paginacion from '../../components/Paginacion';
import AutocompleteUsuario from '../../components/AutocompleteUsuario';
import ActionButton from '../../components/ActionButton';

const roleBadges = {
  SuperAdmin: 'bg-rose-50 text-rose-700 ring-rose-200',
  Administrador: 'bg-violet-50 text-violet-700 ring-violet-200',
  Recepcionista: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  Entrenador: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Alumno: 'bg-blue-50 text-blue-700 ring-blue-200',
};

const roleAvatares = {
  SuperAdmin: 'bg-rose-500',
  Administrador: 'bg-violet-500',
  Recepcionista: 'bg-cyan-500',
  Entrenador: 'bg-invictus-600',
  Alumno: 'bg-blue-500',
};

const roleLabels = {
  SuperAdmin: 'Súper Admin',
  Administrador: 'Administrador',
  Recepcionista: 'Recepción',
  Entrenador: 'Entrenador',
  Alumno: 'Alumno',
};

const allRoleOptions = [
  { value: 'Alumno', label: 'Alumno' },
  { value: 'Entrenador', label: 'Entrenador' },
  { value: 'Recepcionista', label: 'Recepcionista' },
  { value: 'Administrador', label: 'Administrador' },
  { value: 'SuperAdmin', label: 'Súper Admin' },
];

function ManageUsers() {
  useTituloPagina('Usuarios');
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.rol === 'SuperAdmin';
  const editRoleOptions = isSuperAdmin
    ? allRoleOptions
    : allRoleOptions.filter(opt => !['SuperAdmin', 'Administrador'].includes(opt.value));

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [turnoAsignar, setTurnoAsignar] = useState('');
  const [turnoError, setTurnoError] = useState('');
  const [viewUserId, setViewUserId] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

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
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers(filtroRol || null);
      setUsuarios(data.usuarios || []);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filtroRol]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroRol]);

  /* ── Estadísticas de cabecera ── */
  const totalUsuarios = usuarios.length;
  const totalActivos = usuarios.filter((u) => u.estado === 'activo').length;
  const totalEntrenadores = usuarios.filter((u) => u.rol === 'Entrenador').length;
  const totalAlumnos = usuarios.filter((u) => u.rol === 'Alumno').length;

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!busqueda.trim()) return true;
    const texto = `${u.nombre || ''} ${u.correo || ''} ${u.ci || ''}`.toLowerCase();
    return texto.includes(busqueda.trim().toLowerCase());
  });
  const visibles = usuariosFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina);

  const iniciales = (nombre) =>
    (nombre || '?').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const openEdit = async (user) => {
    setEditUser(user);
    setEditForm({
      nombre: user.nombre,
      correo: user.correo,
      password: '',
      rol: user.rol,
      ci: user.ci || '',
      fecha_nacimiento: user.fecha_nacimiento ? user.fecha_nacimiento.slice(0, 10) : '',
      celular: user.celular || '',
      direccion: user.direccion || '',
      estado_pago: user.estado_pago || 'pendiente',
      fecha_inscripcion: user.fecha_inscripcion ? user.fecha_inscripcion.slice(0, 10) : '',
      fecha_vencimiento: user.fecha_vencimiento ? user.fecha_vencimiento.slice(0, 10) : '',
      nivel_deportivo: user.nivel_deportivo || 'principiante',
      peso_actual: user.peso_actual || '',
      objetivo_entrenamiento: user.objetivo_entrenamiento || '',
      observacion_medica: user.observacion_medica || '',
      especialidad: user.especialidad || '',
      experiencia_anios: user.experiencia_anios || '',
      fecha_ingreso: user.fecha_ingreso ? user.fecha_ingreso.slice(0, 10) : '',
      estado_laboral: user.estado_laboral || 'activo',
      observaciones: user.observaciones || '',
      turno_trabajo: user.turno_trabajo || '',
      area: user.area || '',
      cargo: user.cargo || '',
      celular_institucional: user.celular_institucional || '',
      estado: user.estado || 'activo',
    });
    setTurnoError('');
    if (user.rol === 'Alumno') {
      try {
        const res = await getHorarioActual(user.alumno_id);
        const h = res.horario;
        setTurnoAsignar(h?.turno || h?.turno_horario || '');
      } catch {
        setTurnoAsignar('');
      }
    } else {
      setTurnoAsignar('');
    }
    setError('');
    setSuccess('');
  };

  const closeEdit = () => {
    setEditUser(null);
    setEditForm({});
    setTurnoAsignar('');
    setTurnoError('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'rol') {
      setTurnoAsignar('');
      setTurnoError('');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTurnoError('');

    const nuevaRol = editForm.rol;
    if (nuevaRol === 'Alumno' && !turnoAsignar) {
      setTurnoError('Debes seleccionar un turno para el alumno');
      return;
    }

    try {
      if (editForm.estado_pago === 'vencido' && editForm.fecha_vencimiento) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const venc = new Date(editForm.fecha_vencimiento + 'T00:00:00');
        if (venc >= hoy) {
          setError('No se puede marcar como vencido porque la fecha de vencimiento aún está vigente.');
          return;
        }
      }
      const data = {};
      if (editForm.nombre.trim() !== editUser.nombre) data.nombre = editForm.nombre.trim();
      if (editForm.correo.trim() !== editUser.correo) data.correo = editForm.correo.trim();
      if (editForm.password.trim()) data.password = editForm.password;
      if (editForm.rol !== editUser.rol) data.rol = editForm.rol;
      if (editForm.ci.trim() !== (editUser.ci || '')) data.ci = editForm.ci.trim();
      if (editForm.fecha_nacimiento !== (editUser.fecha_nacimiento?.slice(0, 10) || '')) data.fecha_nacimiento = editForm.fecha_nacimiento;
      if (editForm.celular.trim() !== (editUser.celular || '')) data.celular = editForm.celular.trim();
      if (editForm.direccion.trim() !== (editUser.direccion || '')) data.direccion = editForm.direccion.trim();

      if (nuevaRol === 'Alumno') {
        if (editForm.estado_pago !== (editUser.estado_pago || 'pendiente')) data.estado_pago = editForm.estado_pago;
        if (editForm.fecha_inscripcion !== (editUser.fecha_inscripcion?.slice(0, 10) || '')) data.fecha_inscripcion = editForm.fecha_inscripcion;
        if (editForm.fecha_vencimiento !== (editUser.fecha_vencimiento?.slice(0, 10) || '')) data.fecha_vencimiento = editForm.fecha_vencimiento;
        if (editForm.nivel_deportivo !== (editUser.nivel_deportivo || 'principiante')) data.nivel_deportivo = editForm.nivel_deportivo;
        if (editForm.peso_actual !== (editUser.peso_actual || '')) data.peso_actual = editForm.peso_actual;
        if (editForm.objetivo_entrenamiento !== (editUser.objetivo_entrenamiento || '')) data.objetivo_entrenamiento = editForm.objetivo_entrenamiento;
        if (editForm.observacion_medica !== (editUser.observacion_medica || '')) data.observacion_medica = editForm.observacion_medica;
        if (turnoAsignar) data.turno = turnoAsignar;
      }

      if (nuevaRol === 'Entrenador') {
        if (editForm.especialidad !== (editUser.especialidad || '')) data.especialidad = editForm.especialidad;
        if (editForm.experiencia_anios !== (editUser.experiencia_anios || '')) data.experiencia_anios = editForm.experiencia_anios;
        if (editForm.fecha_ingreso !== (editUser.fecha_ingreso?.slice(0, 10) || '')) data.fecha_ingreso = editForm.fecha_ingreso;
        if (editForm.estado_laboral !== (editUser.estado_laboral || 'activo')) data.estado_laboral = editForm.estado_laboral;
        if (editForm.observaciones !== (editUser.observaciones || '')) data.observaciones = editForm.observaciones;
      }

      if (nuevaRol === 'Recepcionista') {
        if (editForm.turno_trabajo !== (editUser.turno_trabajo || '')) data.turno_trabajo = editForm.turno_trabajo;
        if (editForm.area !== (editUser.area || '')) data.area = editForm.area;
        if (editForm.fecha_ingreso !== (editUser.fecha_ingreso?.slice(0, 10) || '')) data.fecha_ingreso = editForm.fecha_ingreso;
        if (editForm.estado_laboral !== (editUser.estado_laboral || 'activo')) data.estado_laboral = editForm.estado_laboral;
        if (editForm.observaciones !== (editUser.observaciones || '')) data.observaciones = editForm.observaciones;
      }

      if (nuevaRol === 'Administrador') {
        if (editForm.cargo !== (editUser.cargo || '')) data.cargo = editForm.cargo;
        if (editForm.celular_institucional !== (editUser.celular_institucional || '')) data.celular_institucional = editForm.celular_institucional;
        if (editForm.fecha_ingreso !== (editUser.fecha_ingreso?.slice(0, 10) || '')) data.fecha_ingreso = editForm.fecha_ingreso;
        if (editForm.estado_laboral !== (editUser.estado_laboral || 'activo')) data.estado_laboral = editForm.estado_laboral;
        if (editForm.observaciones !== (editUser.observaciones || '')) data.observaciones = editForm.observaciones;
      }

      if (nuevaRol === 'SuperAdmin') {
        if (editForm.cargo !== (editUser.cargo || '')) data.cargo = editForm.cargo;
        if (editForm.celular_institucional !== (editUser.celular_institucional || '')) data.celular_institucional = editForm.celular_institucional;
        if (editForm.fecha_ingreso !== (editUser.fecha_ingreso?.slice(0, 10) || '')) data.fecha_ingreso = editForm.fecha_ingreso;
        if (editForm.estado !== (editUser.estado || 'activo')) data.estado = editForm.estado;
        if (editForm.observaciones !== (editUser.observaciones || '')) data.observaciones = editForm.observaciones;
      }

      if (Object.keys(data).length === 0) {
        closeEdit();
        return;
      }

      await updateUser(editUser.id_usuario, data);

      setSuccess('Usuario actualizado correctamente');
      closeEdit();
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.errors?.[0] || 'Error al actualizar';
      setError(msg);
    }
  };

  const handleQuickPay = async (user) => {
    try {
      const hoy = new Date();
      await marcarPagado({
        alumno_id: user.alumno_id,
        mes: hoy.getMonth() + 1,
        anio: hoy.getFullYear(),
        fecha_pago: hoy.toISOString().slice(0, 10),
      });
      setSuccess(`"${user.nombre}" marcado como pagado`);
      fetchUsers();
    } catch {
      setError('Error al actualizar pago');
    }
  };

  const toggleEstado = async (u) => {
    const nuevo = u.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      await updateUser(u.id_usuario, { estado: nuevo });
      setSuccess(`"${u.nombre}" ahora está ${nuevo}`);
      fetchUsers();
    } catch {
      setError('Error al cambiar estado');
    }
  };

  const handleDelete = async (id, nombre, rol) => {
    if (id === user?.id_usuario) {
      setError('No puedes eliminarte a ti mismo');
      return;
    }
    if (rol === 'SuperAdmin' && !isSuperAdmin) {
      setError('No puedes eliminar un Súper Administrador');
      return;
    }
    if (!window.confirm(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUser(id);
      setSuccess(`"${nombre}" eliminado correctamente`);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.msg || 'Error al eliminar usuario';
      setError(msg);
    }
  };

  const puedeEliminar = (u) =>
    u.id_usuario !== user?.id && u.rol !== 'SuperAdmin' && (isSuperAdmin || u.rol !== 'Administrador');

  return (
    <div>
      {/* ── Cabecera de gestión ── */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-[#172033]">Usuarios</h2>
        <p className="text-slate-500 mt-0.5">Gestiona administradores, entrenadores y alumnos</p>

        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { etiqueta: 'usuarios', valor: totalUsuarios, color: 'text-[#172033]' },
            { etiqueta: 'activos', valor: totalActivos, color: 'text-green-600' },
            { etiqueta: 'entrenadores', valor: totalEntrenadores, color: 'text-emerald-600' },
            { etiqueta: 'alumnos', valor: totalAlumnos, color: 'text-blue-600' },
          ].map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
              <strong className={`text-sm font-bold ${s.color}`}>{s.valor}</strong>
              <span className="text-slate-500">{s.etiqueta}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Barra de herramientas ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-3 mb-5 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <AutocompleteUsuario
            texto={busqueda}
            onTexto={setBusqueda}
            usuarios={usuarios}
            placeholder="Buscar por nombre, CI o correo..."
          />
        </div>

        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className={`border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500 ${
            filtroRol ? 'border-invictus-400 text-invictus-700 font-medium' : 'border-gray-300 text-slate-600'
          }`}
        >
          <option value="">Todos los roles</option>
          {(isSuperAdmin
            ? ['SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno']
            : ['Administrador', 'Recepcionista', 'Entrenador', 'Alumno']
          ).map((r) => (
            <option key={r} value={r}>{roleLabels[r]}s</option>
          ))}
        </select>

        <button
          onClick={() => navigate('/admin/register')}
          className="inline-flex items-center gap-1.5 bg-invictus-600 hover:bg-invictus-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">{success}</div>}

      {/* ── Tabla ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : visibles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">
              {busqueda || filtroRol ? 'No hay usuarios que coincidan con la búsqueda' : 'Aún no hay usuarios registrados'}
            </p>
            {!busqueda && !filtroRol && (
              <button onClick={() => navigate('/admin/register')}
                className="inline-flex items-center gap-2 bg-invictus-600 hover:bg-invictus-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Registrar primer usuario
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                  <th className="px-5 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((u) => (
                  <tr key={u.id_usuario} className="border-b border-gray-50 hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${roleAvatares[u.rol] || 'bg-slate-400'} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                          {iniciales(u.nombre)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#172033] truncate">{u.nombre}</p>
                          <p className="text-xs text-slate-400 truncate">{u.correo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ring-1 ring-inset ${roleBadges[u.rol] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
                        {roleLabels[u.rol] || u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className={`w-2 h-2 rounded-full ${u.estado === 'activo' ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className={u.estado === 'activo' ? 'text-green-700 font-medium' : 'text-slate-400'}>
                          {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                      <ActionButton tipo="ver" onClick={() => setViewUserId(u.id_usuario)} />
                      <ActionButton tipo="editar" onClick={() => openEdit(u)} />
                      {u.rol === 'Alumno' && u.estado_pago !== 'pagado' && (
                        <ActionButton tipo="pagado" onClick={() => handleQuickPay(u)} />
                      )}
                      <ActionButton
                        tipo="estado"
                        titulo={u.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
                        onClick={() => toggleEstado(u)}
                      />
                      {puedeEliminar(u) && (
                        <ActionButton tipo="eliminar" onClick={() => handleDelete(u.id_usuario, u.nombre, u.rol)} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Paginacion
              total={usuariosFiltrados.length}
              pagina={pagina}
              porPagina={porPagina}
              setPagina={setPagina}
              setPorPagina={setPorPagina}
            />
          </>
        )}
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto animate-scale-in">
            <h3 className="text-lg font-bold text-[#172033] mb-4">Editar Usuario</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <UserRoleFields
                mode="edit"
                form={editForm}
                onChange={handleEditChange}
                onTurnoChange={(val) => { setTurnoAsignar(val); setTurnoError(''); }}
                errors={{}}
                roleOptions={editRoleOptions}
                isSuperAdmin={isSuperAdmin}
                turnoAsignar={turnoAsignar}
                turnoError={turnoError}
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-invictus-600 hover:bg-invictus-700 rounded-lg transition-colors"
                >
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

export default ManageUsers;
