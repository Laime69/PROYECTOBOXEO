import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMiPerfil } from '../../services/usuarioService';
import { getMisProgresos } from '../../services/progresoService';

const NIVELES = { inicial: 'Inicial', basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado', competitivo: 'Competitivo' };
const ESTADOS_LABORALES = { activo: 'Activo', inactivo: 'Inactivo', cesado: 'Cesado' };
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

function MiPerfil() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personales');

  const [progresoLoading, setProgresoLoading] = useState(false);
  const [ultimaEvaluacion, setUltimaEvaluacion] = useState(null);
  const [totalEvaluaciones, setTotalEvaluaciones] = useState(0);

  useEffect(() => {
    setLoading(true);
    getMiPerfil()
      .then((res) => {
        setPerfil(res.usuario);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.msg || 'Error al cargar perfil');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!perfil || perfil.rol !== 'Alumno') return;
    if (!['deportivos'].includes(activeTab)) return;

    setProgresoLoading(true);
    getMisProgresos()
      .then((res) => {
        setUltimaEvaluacion(res.ultima_evaluacion || null);
        setTotalEvaluaciones(res.total_evaluaciones || 0);
        setProgresoLoading(false);
      })
      .catch(() => {
        setUltimaEvaluacion(null);
        setTotalEvaluaciones(0);
        setProgresoLoading(false);
      });
  }, [perfil, activeTab]);

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
    return `px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[rol] || 'bg-gray-100 text-gray-800'}`;
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

  const getInfoRow = (label, value) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-500 sm:w-44 mb-1 sm:mb-0">{label}</span>
      <span className="text-sm text-gray-800">{value || '—'}</span>
    </div>
  );

  const getSkillBar = (label, value) => (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs font-medium text-gray-600 w-24">{label}</span>
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!perfil) return null;

  const tabs = [
    { key: 'personales', label: 'Personales', show: true },
    { key: 'inscripcion', label: 'Inscripción', show: perfil.rol === 'Alumno' },
    { key: 'pagos', label: 'Pagos', show: perfil.rol === 'Alumno' },
    { key: 'deportivos', label: 'Deportivos', show: perfil.rol === 'Alumno' },
    { key: 'laborales', label: 'Laborales', show: ['Entrenador', 'Recepcionista', 'Administrador'].includes(perfil.rol) },
    { key: 'acceso', label: 'Acceso', show: perfil.rol === 'SuperAdmin' },
  ].filter(t => t.show);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Mi Perfil</h2>
        <p className="text-gray-500 mt-1">Consulta y gestiona tu información personal</p>
      </div>

      <div className="max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-invictus-100 text-invictus-700 rounded-full flex items-center justify-center text-2xl font-bold">
                {perfil.nombre?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{perfil.nombre}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={getRoleBadge(perfil.rol)}>{getRoleLabel(perfil.rol)}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${perfil.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {perfil.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex border-b border-gray-100 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-invictus-500 text-invictus-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'personales' && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos Personales</h4>
                {getInfoRow('Nombre completo', perfil.nombre)}
                {getInfoRow('Cédula de Identidad', perfil.ci)}
                {getInfoRow('Correo electrónico', perfil.correo)}
                {getInfoRow('Celular', perfil.celular)}
                {getInfoRow('Dirección', perfil.direccion)}
                {getInfoRow('Fecha de nacimiento', formatDate(perfil.fecha_nacimiento))}
                {getInfoRow('Edad', calcularEdad(perfil.fecha_nacimiento) + ' años')}
                {getInfoRow('Rol', getRoleLabel(perfil.rol))}
                {getInfoRow('Estado', perfil.estado === 'activo' ? 'Activo' : 'Inactivo')}
                {getInfoRow('Fecha de registro', formatDate(perfil.fecha_creacion))}
                {perfil.rol === 'Alumno' && (perfil.contacto_emergencia || perfil.celular_contacto_emergencia) && (
                  <>
                    <div className="pt-3 mt-2 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Contacto de Emergencia</h4>
                      {getInfoRow('Nombre del contacto', perfil.contacto_emergencia)}
                      {getInfoRow('Celular del contacto', perfil.celular_contacto_emergencia)}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'inscripcion' && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos de Inscripción</h4>
                {getInfoRow('Fecha de inscripción', formatDate(perfil.fecha_inscripcion))}
                {getInfoRow('Fecha de vencimiento', formatDate(perfil.fecha_vencimiento))}
                {getInfoRow('Estado de pago', perfil.estado_pago === 'pagado' ? 'Pagado' : perfil.estado_pago === 'vencido' ? 'Vencido' : 'Pendiente')}
              </div>
            )}

            {activeTab === 'pagos' && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos de Pago</h4>
                {getInfoRow('Estado de pago', (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${perfil.estado_pago === 'pagado' ? 'bg-green-100 text-green-800' : perfil.estado_pago === 'vencido' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {perfil.estado_pago === 'pagado' ? 'Pagado' : perfil.estado_pago === 'vencido' ? 'Vencido' : 'Pendiente'}
                  </span>
                ))}
                {getInfoRow('Última inscripción', formatDate(perfil.fecha_inscripcion))}
                {getInfoRow('Vencimiento', formatDate(perfil.fecha_vencimiento))}
              </div>
            )}

            {activeTab === 'deportivos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Progreso Deportivo</h4>
                  {perfil.objetivo_entrenamiento && (
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{perfil.objetivo_entrenamiento}</span>
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
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Habilidades</h5>
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
                        <p className="text-xs font-medium text-gray-500 mb-1">Observación del entrenador</p>
                        <p className="text-sm text-gray-700">{ultimaEvaluacion.observacion}</p>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">Total de evaluaciones: {totalEvaluaciones}</p>
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
                {perfil.rol === 'Entrenador' && (
                  <>
                    {getInfoRow('Especialidad', perfil.especialidad)}
                    {getInfoRow('Experiencia', perfil.experiencia_anios ? perfil.experiencia_anios + ' años' : '—')}
                  </>
                )}
                {perfil.rol === 'Recepcionista' && (
                  <>
                    {getInfoRow('Turno de trabajo', TURNOS[perfil.turno_trabajo] || '—')}
                    {getInfoRow('Área', perfil.area)}
                  </>
                )}
                {perfil.rol === 'Administrador' && (
                  <>
                    {getInfoRow('Cargo', perfil.cargo)}
                    {getInfoRow('Celular institucional', perfil.celular_institucional)}
                  </>
                )}
                {getInfoRow('Fecha de ingreso', formatDate(perfil.fecha_ingreso))}
                {getInfoRow('Estado laboral', ESTADOS_LABORALES[perfil.estado_laboral] || perfil.estado_laboral)}
                {getInfoRow('Observaciones', perfil.observaciones)}
              </div>
            )}

            {activeTab === 'acceso' && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos de Acceso</h4>
                {getInfoRow('Correo electrónico', perfil.correo)}
                {getInfoRow('Rol', getRoleLabel(perfil.rol))}
                {getInfoRow('Estado', perfil.estado === 'activo' ? 'Activo' : 'Inactivo')}
                {getInfoRow('Fecha de creación', formatDate(perfil.fecha_creacion))}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Acceso total:</strong> Como Super Administrador, tienes acceso completo a todas las funcionalidades del sistema.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiPerfil;
