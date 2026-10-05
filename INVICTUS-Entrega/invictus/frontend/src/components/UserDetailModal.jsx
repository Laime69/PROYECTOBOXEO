import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsuarioDetalle } from '../services/usuarioService';
import { getHistorialProgreso } from '../services/progresoService';

const NIVELES = { inicial: 'Inicial', basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado', competitivo: 'Competitivo' };
const ESTADOS = { activo: 'Activo', inactivo: 'Inactivo', cesado: 'Cesado' };
const TURNOS = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

const SKILL_LABELS = {
  tecnica: 'Técnica',
  defensa: 'Defensa',
  resistencia: 'Resistencia',
  velocidad: 'Velocidad',
  fuerza: 'Fuerza',
  disciplina: 'Disciplina',
  sparring: 'Sparring',
};

function UserDetailModal({ userId, onClose }) {
  const { user: currentUser } = useAuth();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personales');

  const [progresoLoading, setProgresoLoading] = useState(false);
  const [ultimaEvaluacion, setUltimaEvaluacion] = useState(null);
  const [historialProgreso, setHistorialProgreso] = useState([]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError('');
    setUltimaEvaluacion(null);
    setHistorialProgreso([]);
    getUsuarioDetalle(userId)
      .then((res) => {
        setUsuario(res.usuario);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.msg || 'Error al cargar perfil');
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    if (!usuario || usuario.rol !== 'Alumno') return;
    if (!['deportivos'].includes(activeTab)) return;

    setProgresoLoading(true);
    getHistorialProgreso(usuario.alumno_id || usuario.id_usuario)
      .then((res) => {
        const historial = res.historial || [];
        setHistorialProgreso(historial);
        setUltimaEvaluacion(historial.length > 0 ? historial[0] : null);
        setProgresoLoading(false);
      })
      .catch(() => {
        setHistorialProgreso([]);
        setUltimaEvaluacion(null);
        setProgresoLoading(false);
      });
  }, [usuario, activeTab]);

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '—';
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getRoleBadge = (rol) => {
    const styles = {
      SuperAdmin: 'bg-red-100 text-red-800',
      Administrador: 'bg-purple-100 text-purple-800',
      Recepcionista: 'bg-teal-100 text-teal-800',
      Entrenador: 'bg-green-100 text-green-800',
      Alumno: 'bg-blue-100 text-blue-800',
    };
    return `px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[rol] || 'bg-gray-100 text-[#172033]'}`;
  };

  const getRoleLabel = (rol) => {
    const labels = {
      SuperAdmin: 'Super Admin',
      Administrador: 'Administrador',
      Recepcionista: 'Recepcionista',
      Entrenador: 'Entrenador',
      Alumno: 'Alumno',
    };
    return labels[rol] || rol;
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      activo: 'bg-green-100 text-green-800',
      inactivo: 'bg-gray-100 text-[#172033]',
      cesado: 'bg-red-100 text-red-800',
      pagado: 'bg-green-100 text-green-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      vencido: 'bg-red-100 text-red-800',
    };
    return `px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-[#172033]'}`;
  };

  const canSeeSection = (section) => {
    if (!currentUser || !usuario) return false;
    if (currentUser.rol === 'SuperAdmin') return true;
    if (currentUser.rol === 'Administrador') {
      if (usuario.rol === 'SuperAdmin') return false;
      return true;
    }
    if (currentUser.rol === 'Recepcionista') {
      if (usuario.rol !== 'Alumno') return false;
      return ['personales', 'inscripcion', 'pagos'].includes(section);
    }
    if (currentUser.rol === 'Entrenador') {
      if (usuario.rol !== 'Alumno') return false;
      return ['personales', 'deportivos'].includes(section);
    }
    if (currentUser.rol === 'Alumno') {
      return usuario.id_usuario === currentUser.id_usuario;
    }
    return false;
  };

  const getInfoRow = (label, value) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-slate-500 sm:w-40 mb-1 sm:mb-0">{label}</span>
      <span className="text-sm text-[#172033]">{value || '—'}</span>
    </div>
  );

  const getSkillBar = (label, value) => (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs font-medium text-slate-500 w-24">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${((value || 0) / 10) * 100}%`,
            backgroundColor: value >= 8 ? '#22c55e' : value >= 6 ? '#eab308' : value >= 4 ? '#f97316' : '#ef4444',
          }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{value || 0}/10</span>
    </div>
  );

  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
            <div className="flex justify-end mt-4">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cerrar</button>
            </div>
          </div>
        ) : usuario ? (
          <>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-invictus-100 text-invictus-700 rounded-full flex items-center justify-center text-lg font-bold">
                    {usuario.nombre?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#172033]">{usuario.nombre}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={getRoleBadge(usuario.rol)}>{getRoleLabel(usuario.rol)}</span>
                      <span className={getEstadoBadge(usuario.estado || 'activo')}>{usuario.estado === 'activo' ? 'Activo' : usuario.estado === 'inactivo' ? 'Inactivo' : 'Cesado'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-slate-500 text-xl leading-none">&times;</button>
              </div>
            </div>

            <div className="flex border-b border-gray-100 px-6 overflow-x-auto">
              {canSeeSection('personales') && (
                <button onClick={() => setActiveTab('personales')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'personales' ? 'border-invictus-500 text-invictus-600' : 'border-transparent text-slate-500 hover:text-gray-700'}`}>
                  Personales
                </button>
              )}
              {canSeeSection('inscripcion') && usuario.rol === 'Alumno' && (
                <button onClick={() => setActiveTab('inscripcion')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'inscripcion' ? 'border-invictus-500 text-invictus-600' : 'border-transparent text-slate-500 hover:text-gray-700'}`}>
                  Inscripción
                </button>
              )}
              {canSeeSection('pagos') && usuario.rol === 'Alumno' && (
                <button onClick={() => setActiveTab('pagos')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pagos' ? 'border-invictus-500 text-invictus-600' : 'border-transparent text-slate-500 hover:text-gray-700'}`}>
                  Pagos
                </button>
              )}
              {canSeeSection('deportivos') && usuario.rol === 'Alumno' && (
                <button onClick={() => setActiveTab('deportivos')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'deportivos' ? 'border-invictus-500 text-invictus-600' : 'border-transparent text-slate-500 hover:text-gray-700'}`}>
                  Deportivos
                </button>
              )}
              {canSeeSection('laborales') && ['Entrenador', 'Recepcionista', 'Administrador'].includes(usuario.rol) && (
                <button onClick={() => setActiveTab('laborales')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'laborales' ? 'border-invictus-500 text-invictus-600' : 'border-transparent text-slate-500 hover:text-gray-700'}`}>
                  Laborales
                </button>
              )}
              {canSeeSection('acceso') && usuario.rol === 'SuperAdmin' && (
                <button onClick={() => setActiveTab('acceso')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'acceso' ? 'border-invictus-500 text-invictus-600' : 'border-transparent text-slate-500 hover:text-gray-700'}`}>
                  Acceso
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'personales' && (
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos Personales</h4>
                  {getInfoRow('Nombre completo', usuario.nombre)}
                  {getInfoRow('Cédula de Identidad', usuario.ci)}
                  {getInfoRow('Correo electrónico', usuario.correo)}
                  {getInfoRow('Celular', usuario.celular)}
                  {getInfoRow('Dirección', usuario.direccion)}
                  {getInfoRow('Fecha de nacimiento', formatDate(usuario.fecha_nacimiento))}
                  {getInfoRow('Edad', calcularEdad(usuario.fecha_nacimiento) + ' años')}
                  {getInfoRow('Rol', getRoleLabel(usuario.rol))}
                  {getInfoRow('Estado', usuario.estado === 'activo' ? 'Activo' : usuario.estado === 'inactivo' ? 'Inactivo' : 'Cesado')}
                  {getInfoRow('Fecha de registro', formatDate(usuario.fecha_creacion))}
                  {usuario.rol === 'Alumno' && (usuario.contacto_emergencia || usuario.celular_contacto_emergencia) && (
                    <>
                      <div className="pt-3 mt-2 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Contacto de Emergencia</h4>
                        {getInfoRow('Nombre del contacto', usuario.contacto_emergencia)}
                        {getInfoRow('Celular del contacto', usuario.celular_contacto_emergencia)}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'inscripcion' && (
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos de Inscripción</h4>
                  {getInfoRow('Fecha de inscripción', formatDate(usuario.fecha_inscripcion))}
                  {getInfoRow('Fecha de vencimiento', formatDate(usuario.fecha_vencimiento))}
                  {getInfoRow('Estado de pago', usuario.estado_pago === 'pagado' ? 'Pagado' : usuario.estado_pago === 'vencido' ? 'Vencido' : 'Pendiente')}
                </div>
              )}

              {activeTab === 'pagos' && (
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos de Pago</h4>
                  {getInfoRow('Estado de pago', (
                    <span className={getEstadoBadge(usuario.estado_pago || 'pendiente')}>
                      {usuario.estado_pago === 'pagado' ? 'Pagado' : usuario.estado_pago === 'vencido' ? 'Vencido' : 'Pendiente'}
                    </span>
                  ))}
                  {getInfoRow('Última inscripción', formatDate(usuario.fecha_inscripcion))}
                  {getInfoRow('Vencimiento', formatDate(usuario.fecha_vencimiento))}
                </div>
              )}

              {activeTab === 'deportivos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Progreso Deportivo</h4>
                    {usuario.objetivo_entrenamiento && (
                      <span className="text-xs text-slate-500 bg-gray-50 px-2 py-1 rounded">{usuario.objetivo_entrenamiento}</span>
                    )}
                  </div>
                  {progresoLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-3 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
                    </div>
                  ) : ultimaEvaluacion ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-blue-50 rounded-lg px-3 py-2">
                          <p className="text-xs text-blue-600 font-medium">Nivel actual</p>
                          <p className="text-sm font-bold text-blue-800">{NIVELES[ultimaEvaluacion.nivel] || ultimaEvaluacion.nivel}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg px-3 py-2">
                          <p className="text-xs text-green-600 font-medium">Promedio</p>
                          <p className="text-sm font-bold text-green-800">{ultimaEvaluacion.promedio != null ? parseFloat(ultimaEvaluacion.promedio).toFixed(1) : '—'}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg px-3 py-2">
                          <p className="text-xs text-purple-600 font-medium">Peso</p>
                          <p className="text-sm font-bold text-purple-800">{ultimaEvaluacion.peso ? ultimaEvaluacion.peso + ' kg' : '—'}</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg px-3 py-2">
                          <p className="text-xs text-amber-600 font-medium">Última eval.</p>
                          <p className="text-sm font-bold text-amber-800">{formatDate(ultimaEvaluacion.fecha_evaluacion)}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Habilidades</h5>
                        <div className="space-y-0.5">
                          {Object.entries(SKILL_LABELS).map(([key, label]) => (
                            <div key={key}>
                              {getSkillBar(label, ultimaEvaluacion[key])}
                            </div>
                          ))}
                        </div>
                      </div>

                      {ultimaEvaluacion.observacion && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-medium text-slate-500 mb-1">Observación del entrenador</p>
                          <p className="text-sm text-gray-700">{ultimaEvaluacion.observacion}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-400 text-sm">No hay evaluación deportiva registrada.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'laborales' && (
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos Laborales</h4>
                  {usuario.rol === 'Entrenador' && (
                    <>
                      {getInfoRow('Especialidad', usuario.especialidad)}
                      {getInfoRow('Experiencia', usuario.experiencia_anios ? usuario.experiencia_anios + ' años' : '—')}
                    </>
                  )}
                  {usuario.rol === 'Recepcionista' && (
                    <>
                      {getInfoRow('Turno de trabajo', TURNOS[usuario.turno_trabajo] || '—')}
                      {getInfoRow('Área', usuario.area)}
                    </>
                  )}
                  {usuario.rol === 'Administrador' && (
                    <>
                      {getInfoRow('Cargo', usuario.cargo)}
                      {getInfoRow('Celular institucional', usuario.celular_institucional)}
                    </>
                  )}
                  {getInfoRow('Fecha de ingreso', formatDate(usuario.fecha_ingreso))}
                  {getInfoRow('Estado laboral', ESTADOS[usuario.estado_laboral] || usuario.estado_laboral)}
                  {getInfoRow('Observaciones', usuario.observaciones)}
                </div>
              )}

              {activeTab === 'acceso' && (
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos de Acceso</h4>
                  {getInfoRow('Correo electrónico', usuario.correo)}
                  {getInfoRow('Rol', getRoleLabel(usuario.rol))}
                  {getInfoRow('Estado', usuario.estado === 'activo' ? 'Activo' : 'Inactivo')}
                  {getInfoRow('Fecha de creación', formatDate(usuario.fecha_creacion))}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <strong>Acceso total:</strong> Como Super Administrador, tienes acceso completo a todas las funcionalidades del sistema.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Cerrar
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default UserDetailModal;
