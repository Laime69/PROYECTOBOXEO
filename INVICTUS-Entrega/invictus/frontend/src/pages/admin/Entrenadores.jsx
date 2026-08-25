import { useState, useEffect, useMemo } from 'react';
import { useTituloPagina } from '../../hooks/useTituloPagina';
import { getUsers } from '../../services/usuarioService';
import UserDetailModal from '../../components/UserDetailModal';
import ActionButton from '../../components/ActionButton';
import CabeceraPagina from '../../components/CabeceraPagina';

const ESTADO_LABORAL_LABELS = { activo: 'Activo', inactivo: 'Inactivo', cesado: 'Cesado' };

function Entrenadores() {
  useTituloPagina('Entrenadores');
  const [entrenadores, setEntrenadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewUserId, setViewUserId] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [especialidadFiltro, setEspecialidadFiltro] = useState('');
  const [estadoLaboralFiltro, setEstadoLaboralFiltro] = useState('');
  const [estadoCuentaFiltro, setEstadoCuentaFiltro] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getUsers('Entrenador');
        setEntrenadores(data.usuarios || []);
      } catch {
        setError('Error al cargar entrenadores');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const especialidades = useMemo(
    () => [...new Set(entrenadores.map((e) => e.especialidad).filter(Boolean))].sort(),
    [entrenadores]
  );

  const filtrados = useMemo(() => {
    return entrenadores.filter((e) => {
      const texto = `${e.nombre || ''} ${e.correo || ''} ${e.ci || ''} ${e.celular || ''}`.toLowerCase();
      if (busqueda.trim() && !texto.includes(busqueda.trim().toLowerCase())) return false;
      if (especialidadFiltro && (e.especialidad || '') !== especialidadFiltro) return false;
      if (estadoLaboralFiltro && (e.estado_laboral || '') !== estadoLaboralFiltro) return false;
      if (estadoCuentaFiltro && (e.estado || '') !== estadoCuentaFiltro) return false;
      return true;
    });
  }, [entrenadores, busqueda, especialidadFiltro, estadoLaboralFiltro, estadoCuentaFiltro]);

  useEffect(() => {
    if (!error) return undefined;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  // autodismiss-ok
  const limpiarFiltros = () => {
    setBusqueda('');
    setEspecialidadFiltro('');
    setEstadoLaboralFiltro('');
    setEstadoCuentaFiltro('');
  };

  const hayFiltrosActivos = Boolean(busqueda.trim() || especialidadFiltro || estadoLaboralFiltro || estadoCuentaFiltro);

  const activos = entrenadores.filter((e) => e.estado === 'activo').length;

  return (
    <div>
      <CabeceraPagina
        titulo="Entrenadores"
        subtitulo="Cuerpo técnico de la academia"
        stats={[
          { valor: entrenadores.length, etiqueta: 'entrenadores', color: 'text-[#172033]' },
          { valor: activos, etiqueta: 'activos', color: 'text-green-600' },
          { valor: especialidades.length, etiqueta: 'especialidades', color: 'text-emerald-600' },
        ]}
      />

      {/* ── Barra de filtros ── */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-4 mb-5">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <div className="flex-1 min-w-[230px]">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Buscar</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, correo o CI..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Especialidad</label>
            <select value={especialidadFiltro} onChange={(e) => setEspecialidadFiltro(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500 ${especialidadFiltro ? 'border-invictus-400 text-invictus-700 font-medium' : 'border-gray-300'}`}>
              <option value="">Todas</option>
              {especialidades.map((esp) => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Estado laboral</label>
            <select value={estadoLaboralFiltro} onChange={(e) => setEstadoLaboralFiltro(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500 ${estadoLaboralFiltro ? 'border-invictus-400 text-invictus-700 font-medium' : 'border-gray-300'}`}>
              <option value="">Todos</option>
              {Object.entries(ESTADO_LABORAL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Cuenta</label>
            <select value={estadoCuentaFiltro} onChange={(e) => setEstadoCuentaFiltro(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500 ${estadoCuentaFiltro ? 'border-invictus-400 text-invictus-700 font-medium' : 'border-gray-300'}`}>
              <option value="">Todas</option>
              <option value="activo">Activa</option>
              <option value="inactivo">Inactiva</option>
            </select>
          </div>

          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros}
              className="px-4 py-2 text-sm font-medium text-slate-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Resultados</h3>
          <span className="text-xs text-gray-400">{filtrados.length} entrenador{filtrados.length !== 1 ? 'es' : ''}</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">
              {hayFiltrosActivos ? 'No hay entrenadores que coincidan con los filtros' : 'Aún no hay entrenadores registrados'}
            </p>
            {!hayFiltrosActivos && (
              <a href="/admin/register" className="inline-flex items-center gap-2 bg-invictus-600 hover:bg-invictus-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Registrar entrenador
              </a>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-gray-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">CI</th>
                  <th className="px-4 py-3 font-semibold">Celular</th>
                  <th className="px-4 py-3 font-semibold">Correo</th>
                  <th className="px-4 py-3 font-semibold">Especialidad</th>
                  <th className="px-4 py-3 font-semibold">Estado laboral</th>
                  <th className="px-4 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((e) => (
                  <tr key={e.id_usuario} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-invictus-100 text-invictus-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {(e.nombre || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[#172033]">{e.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{e.ci || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{e.celular || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{e.correo}</td>
                    <td className="px-4 py-3">
                      {e.especialidad
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{e.especialidad}</span>
                        : <span className="text-sm text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.estado_laboral === 'activo' ? 'bg-green-100 text-green-800'
                          : e.estado_laboral === 'cesado' ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ESTADO_LABORAL_LABELS[e.estado_laboral] || e.estado_laboral || '—'}
                      </span>
                      {e.estado === 'inactivo' && (
                        <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-slate-500">Cta. inactiva</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionButton tipo="ver" onClick={() => setViewUserId(e.id_usuario)} titulo={`Ver a ${e.nombre}`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewUserId && (
        <UserDetailModal userId={viewUserId} onClose={() => setViewUserId(null)} />
      )}
    </div>
  );
}

export default Entrenadores;
