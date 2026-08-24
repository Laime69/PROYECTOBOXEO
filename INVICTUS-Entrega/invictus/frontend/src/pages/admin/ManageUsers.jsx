import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsers, updateUser, deleteUser } from '../../services/usuarioService';
import { asignarTurno, cambiarTurno, getHorarioActual } from '../../services/alumnoHorarioService';
import UserDetailModal from '../../components/UserDetailModal';
import UserRoleFields from '../../components/UserRoleFields';

const roleStyles = {
  SuperAdmin: 'bg-red-100 text-red-800',
  Administrador: 'bg-purple-100 text-purple-800',
  Recepcionista: 'bg-teal-100 text-teal-800',
  Entrenador: 'bg-green-100 text-green-800',
  Alumno: 'bg-blue-100 text-blue-800',
};

const pagoStyles = {
  pagado: 'bg-green-100 text-green-800',
  pendiente: 'bg-yellow-100 text-yellow-800',
  vencido: 'bg-red-100 text-red-800',
};

const pagoLabels = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  vencido: 'Vencido',
};

  const allRoleOptions = [
    { value: 'Alumno', label: 'Alumno' },
    { value: 'Entrenador', label: 'Entrenador' },
    { value: 'Recepcionista', label: 'Recepcionista' },
    { value: 'Administrador', label: 'Administrador' },
    { value: 'SuperAdmin', label: 'Súper Admin' },
  ];

function ManageUsers() {
  const { user } = useAuth();
  const isSuperAdmin = user?.rol === 'SuperAdmin';
  const editRoleOptions = isSuperAdmin
    ? allRoleOptions
    : allRoleOptions.filter(opt => !['SuperAdmin', 'Administrador'].includes(opt.value));
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [turnoAsignar, setTurnoAsignar] = useState('');
  const [turnoError, setTurnoError] = useState('');
  const [viewUserId, setViewUserId] = useState(null);

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
        const res = await getHorarioActual(user.id_usuario);
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
      const vencimiento = new Date(hoy);
      vencimiento.setDate(vencimiento.getDate() + 30);

      await updateUser(user.id_usuario, {
        estado_pago: 'pagado',
        fecha_inscripcion: hoy.toISOString().slice(0, 10),
        fecha_vencimiento: vencimiento.toISOString().slice(0, 10),
      });
      setSuccess(`"${user.nombre}" marcado como pagado`);
      fetchUsers();
    } catch {
      setError('Error al actualizar pago');
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

  const getRoleBadge = (rol) => {
    return `px-2 py-0.5 rounded-full text-xs font-medium ${roleStyles[rol] || 'bg-gray-100 text-gray-800'}`;
  };

  const getPagoBadge = (estado) => {
    return `px-2 py-0.5 rounded-full text-xs font-medium ${pagoStyles[estado] || 'bg-gray-100 text-gray-800'}`;
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRoleDisplay = (rol) => {
    const labels = {
      SuperAdmin: 'Súper Admin',
      Administrador: 'Administrador',
      Recepcionista: 'Recepcionista',
      Entrenador: 'Entrenador',
      Alumno: 'Alumno',
    };
    return labels[rol] || rol;
  };

  const availableRoleFilters = isSuperAdmin
    ? ['', 'SuperAdmin', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno']
    : ['', 'Administrador', 'Recepcionista', 'Entrenador', 'Alumno'];

  const filterLabels = {
    '': 'Todos',
    SuperAdmin: 'Súper Admins',
    Administrador: 'Administradores',
    Recepcionista: 'Recepcionistas',
    Entrenador: 'Entrenadores',
    Alumno: 'Alumnos',
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Gestionar Usuarios</h2>
        <p className="text-gray-500 mt-1">Administra los usuarios del sistema</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por rol:</label>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500"
          >
            {availableRoleFilters.map((val) => (
              <option key={val} value={val}>{filterLabels[val]}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay usuarios registrados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">CI</th>
                  <th className="px-4 py-3 font-medium">Celular</th>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id_usuario} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{u.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.ci || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.celular || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.correo}</td>
                    <td className="px-4 py-3">
                      <span className={getRoleBadge(u.rol)}>{getRoleDisplay(u.rol)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewUserId(u.id_usuario)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="text-sm text-invictus-600 hover:text-invictus-800 font-medium"
                        >
                          Editar
                        </button>
                        {u.rol === 'Alumno' && u.estado_pago !== 'pagado' && (
                          <button
                            onClick={() => handleQuickPay(u)}
                            className="text-sm text-green-600 hover:text-green-800 font-medium"
                          >
                            Pagado
                          </button>
                        )}
                        {u.id_usuario !== user?.id && u.rol !== 'SuperAdmin' && (isSuperAdmin || u.rol !== 'Administrador') && (
                          <button
                            onClick={() => handleDelete(u.id_usuario, u.nombre, u.rol)}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Editar Usuario
            </h3>
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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