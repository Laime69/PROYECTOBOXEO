import { useEffect, useState, useMemo } from 'react';
import {
  NOMBRES_TIPO_EVALUACION,
  NOMBRES_NIVEL,
  COLORES_NIVEL,
  ESTADOS_PROGRESO,
  formatearFecha,
} from '../../utils/progresoUtils';
import {
  getHistorialProgreso,
  deleteProgreso,
  getProgreso,
  compararEvaluaciones,
} from '../../services/progresoService';
import ActionButton from '../ActionButton';
import Paginacion from '../Paginacion';
import ReportPDFPreview from '../ReportPDFPreview';
import { construirDocumentoHTML, imprimirHTML } from '../../utils/printReport';

function HistorialEvaluaciones({ alumnoId, alumnoNombre, onClose, onEvaluacionEliminada, onEditar, readOnly = false }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [seleccion, setSeleccion] = useState([]);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [compararModal, setCompararModal] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await getHistorialProgreso(alumnoId);
      setHistorial(data.historial || []);
    } catch {
      setError('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [alumnoId]);

  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape') { onClose(); setDetalle(null); setCompararModal(null); }
    };
    window.addEventListener('keydown', manejarTecla);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', manejarTecla);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const paginaActual = useMemo(() => {
    const inicio = (pagina - 1) * porPagina;
    return historial.slice(inicio, inicio + porPagina);
  }, [historial, pagina, porPagina]);

  const toggleSeleccion = (id) => {
    setSeleccion((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const handleEliminar = async () => {
    try {
      await deleteProgreso(confirmarEliminar);
      setConfirmarEliminar(null);
      cargar();
      onEvaluacionEliminada?.();
    } catch {
      setError('Error al eliminar la evaluación');
      setConfirmarEliminar(null);
    }
  };

  const verDetalle = async (id) => {
    try {
      const data = await getProgreso(id);
      setDetalle(data.progreso);
    } catch {
      setError('Error al cargar el detalle');
    }
  };

  const verComparar = async () => {
    if (seleccion.length !== 2) return;
    try {
      const data = await compararEvaluaciones(seleccion[0], seleccion[1]);
      setCompararModal(data);
    } catch {
      setError('No se pudieron comparar las evaluaciones');
    }
  };

  const generarPDF = () => {
    const filtrarSeleccion = seleccion.length === 2 ? (h) => seleccion.includes(h.id) : () => true;
    const items = historial.filter(filtrarSeleccion);
    const doc = {
      titulo: 'Historial de Evaluaciones de Progreso',
      periodo: alumnoNombre,
      filtros: [{ etiqueta: 'Alumno', valor: alumnoNombre }],
      resumen: [
        { etiqueta: 'Total evaluaciones', valor: items.length, color: '#00A878' },
      ],
      secciones: [{
        titulo: 'Evaluaciones de progreso',
        columnas: ['Fecha', 'Tipo', 'Nivel', 'Peso (kg)', 'Promedio', '% Progreso', 'Estado'],
        filas: items.map((h) => [
          formatearFecha(h.fecha_evaluacion),
          NOMBRES_TIPO_EVALUACION[h.tipo_evaluacion] || '—',
          NOMBRES_NIVEL[h.nivel] || '—',
          h.peso ?? '—',
          h.promedio_general ?? '—',
          h.porcentaje_progreso != null ? `${h.porcentaje_progreso}%` : '—',
          h.estado_progreso || '—',
        ]),
      }],
    };
    setPdfDoc(doc);
  };

  const renderAreasDetalle = (ev) => {
    const areas = [
      { label: 'Técnica Ofensiva', claves: ['jab', 'directo', 'gancho', 'uppercut', 'combinaciones', 'precision_golpes'] },
      { label: 'Técnica Defensiva', claves: ['guardia', 'bloqueos', 'esquives', 'contragolpe', 'evitar_golpes'] },
      { label: 'Desplazamiento', claves: ['juego_piernas', 'equilibrio', 'coordinacion', 'manejo_ring', 'control_distancia'] },
      { label: 'Condición Física', claves: ['resistencia', 'velocidad', 'fuerza', 'agilidad', 'recuperacion'] },
      { label: 'Sparring y Táctica', claves: ['estrategia', 'reaccion', 'control_emocional', 'aplicacion_tecnicas', 'rendimiento_asaltos'] },
      { label: 'Disciplina', claves: ['asistencia_eval', 'puntualidad', 'esfuerzo', 'respeto', 'cumplimiento_instrucciones'] },
    ];
    return areas.map((area) => {
      const valores = area.claves.filter((c) => ev[c] != null);
      if (valores.length === 0) return null;
      return (
        <div key={area.label} className="border border-gray-100 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-500 mb-1">{area.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {area.claves.filter((c) => ev[c] != null).map((c) => (
              <span key={c} className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5 text-xs">
                {c} <strong className="text-[#172033]">{ev[c]}</strong>
              </span>
            ))}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#071A2B]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-[#172033]">Historial de Evaluaciones</h3>
            <p className="text-xs text-slate-500">{alumnoNombre}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={generarPDF}
              className="px-2.5 py-1 text-xs text-slate-500 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1">
              Exportar
            </button>
            <button
              onClick={verComparar}
              disabled={seleccion.length !== 2}
              className="px-2.5 py-1 text-xs font-medium text-invictus-700 bg-invictus-50 hover:bg-invictus-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
              Comparar ({seleccion.length}/2)
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-slate-600 text-xl leading-none">&times;</button>
          </div>
        </div>

        {error && <div className="m-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No hay evaluaciones registradas</div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-gray-200">
                  <th className="px-3 py-2 w-6"><input type="checkbox" className="accent-invictus-600" checked={seleccion.length === 2} onChange={() => {}} /></th>
                  <th className="px-3 py-2 font-semibold">Fecha</th>
                  <th className="px-3 py-2 font-semibold">Tipo</th>
                  <th className="px-3 py-2 font-semibold text-center">Peso</th>
                  <th className="px-3 py-2 font-semibold text-center">Nivel</th>
                  <th className="px-3 py-2 font-semibold text-center">Promedio</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold">Observ.</th>
                  <th className="px-3 py-2 text-right font-semibold">Acc.</th>
                </tr>
              </thead>
              <tbody>
                {paginaActual.map((h) => (
                  <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input type="checkbox" className="accent-invictus-600"
                        checked={seleccion.includes(h.id)}
                        onChange={() => toggleSeleccion(h.id)} />
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{formatearFecha(h.fecha_evaluacion)}</td>
                    <td className="px-3 py-2 text-slate-600">{NOMBRES_TIPO_EVALUACION[h.tipo_evaluacion] || '—'}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{h.peso ?? '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ${COLORES_NIVEL[h.nivel] || 'bg-gray-100 text-gray-700'}`}>
                        {NOMBRES_NIVEL[h.nivel] || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-semibold text-gray-700">{h.promedio_general ?? '—'}</span>
                      {h.porcentaje_progreso != null && <span className="text-[10px] text-slate-400 ml-0.5">{h.porcentaje_progreso}%</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ${ESTADOS_PROGRESO[h.estado_progreso]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {h.estado_progreso || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500 max-w-[100px] truncate text-xs" title={h.observacion}>{h.observacion || '—'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-0.5">
                        <ActionButton tipo="ver" onClick={() => verDetalle(h.id)} />
                        {!readOnly && (
                          <>
                            <ActionButton tipo="editar" onClick={() => onEditar(h)} />
                            <ActionButton tipo="eliminar" onClick={() => setConfirmarEliminar(h.id)} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {historial.length > porPagina && (
          <Paginacion total={historial.length} pagina={pagina} porPagina={porPagina} setPagina={setPagina} setPorPagina={setPorPagina} />
        )}

        <div className="flex justify-end px-5 py-2.5 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-slate-500 hover:text-[#172033] border border-gray-300 rounded-lg">
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal de detalle */}
      {detalle && (
        <div className="fixed inset-0 z-50 bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-[#172033]">Detalle de Evaluación</h4>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-slate-400">Fecha</p><p className="font-medium text-[#172033]">{formatearFecha(detalle.fecha_evaluacion)}</p></div>
                <div><p className="text-xs text-slate-400">Tipo</p><p className="font-medium text-[#172033]">{NOMBRES_TIPO_EVALUACION[detalle.tipo_evaluacion]}</p></div>
                <div><p className="text-xs text-slate-400">Peso</p><p className="font-medium text-[#172033]">{detalle.peso ?? '—'} kg</p></div>
                <div><p className="text-xs text-slate-400">Nivel</p><p className="font-medium text-[#172033]">{NOMBRES_NIVEL[detalle.nivel] || '—'}</p></div>
                <div><p className="text-xs text-slate-400">Promedio general</p><p className="font-medium text-[#172033]">{detalle.promedio_general ?? '—'}</p></div>
                <div><p className="text-xs text-slate-400">% Progreso</p><p className="font-medium text-[#172033]">{detalle.porcentaje_progreso ?? '—'}%</p></div>
                <div><p className="text-xs text-slate-400">Categoría</p><p className="font-medium text-[#172033]">{detalle.categoria_peso || '—'}</p></div>
                <div><p className="text-xs text-slate-400">Entrenador</p><p className="font-medium text-[#172033]">{detalle.entrenador_nombre || '—'}</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderAreasDetalle(detalle)}
              </div>
              {detalle.fortalezas && <div><p className="text-xs font-semibold text-slate-400">Fortalezas</p><p className="text-sm text-slate-600">{detalle.fortalezas}</p></div>}
              {detalle.aspectos_mejorar && <div><p className="text-xs font-semibold text-slate-400">Aspectos por mejorar</p><p className="text-sm text-slate-600">{detalle.aspectos_mejorar}</p></div>}
              {detalle.observacion && <div><p className="text-xs font-semibold text-slate-400">Observaciones</p><p className="text-sm text-slate-600">{detalle.observacion}</p></div>}
              {detalle.recomendaciones && <div><p className="text-xs font-semibold text-slate-400">Recomendaciones</p><p className="text-sm text-slate-600">{detalle.recomendaciones}</p></div>}
              {detalle.proximo_objetivo && <div><p className="text-xs font-semibold text-slate-400">Próximo objetivo</p><p className="text-sm text-slate-600">{detalle.proximo_objetivo}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* Modal de comparación */}
      {compararModal && (
        <div className="fixed inset-0 z-[60] bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal p-5 w-full max-w-3xl max-h-[85vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-[#172033]">Comparación de Evaluaciones</h4>
              <button onClick={() => setCompararModal(null)} className="text-gray-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <CompararTabla e1={compararModal.evaluacion_1} e2={compararModal.evaluacion_2} />
          </div>
        </div>
      )}

      {/* Confirmación de eliminación */}
      {confirmarEliminar && (
        <div className="fixed inset-0 z-[60] bg-[#071A2B]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal p-5 w-full max-w-sm text-center animate-scale-in">
            <div className="text-3xl mb-2">🗑️</div>
            <h4 className="text-base font-bold text-[#172033] mb-1">¿Eliminar evaluación?</h4>
            <p className="text-xs text-slate-500 mb-4">No se puede deshacer; se recalculará el progreso.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setConfirmarEliminar(null)} className="px-4 py-2 text-sm text-slate-500 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleEliminar} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportPDFPreview open={!!pdfDoc} onClose={() => setPdfDoc(null)} doc={pdfDoc} />
    </div>
  );
}

function CompararTabla({ e1, e2 }) {
  const filas = [
    ['Fecha', formatearFecha(e1.fecha_evaluacion), formatearFecha(e2.fecha_evaluacion)],
    ['Tipo', NOMBRES_TIPO_EVALUACION[e1.tipo_evaluacion] || '—', NOMBRES_TIPO_EVALUACION[e2.tipo_evaluacion] || '—'],
    ['Peso (kg)', e1.peso ?? '—', e2.peso ?? '—'],
    ['Nivel', NOMBRES_NIVEL[e1.nivel] || '—', NOMBRES_NIVEL[e2.nivel] || '—'],
    ['Técnica Ofensiva', e1.promedio_tecnica_ofensiva ?? '—', e2.promedio_tecnica_ofensiva ?? '—'],
    ['Técnica Defensiva', e1.promedio_tecnica_defensiva ?? '—', e2.promedio_tecnica_defensiva ?? '—'],
    ['Desplazamiento', e1.promedio_desplazamiento ?? '—', e2.promedio_desplazamiento ?? '—'],
    ['Condición Física', e1.promedio_condicion_fisica ?? '—', e2.promedio_condicion_fisica ?? '—'],
    ['Sparring y Táctica', e1.promedio_sparring_tactica ?? '—', e2.promedio_sparring_tactica ?? '—'],
    ['Disciplina', e1.promedio_disciplina ?? '—', e2.promedio_disciplina ?? '—'],
    ['Promedio general', e1.promedio_general ?? '—', e2.promedio_general ?? '—'],
    ['% Progreso', e1.porcentaje_progreso != null ? `${e1.porcentaje_progreso}%` : '—', e2.porcentaje_progreso != null ? `${e2.porcentaje_progreso}%` : '—'],
  ];
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="text-left border-b border-gray-200 bg-slate-50">
          <th className="px-3 py-1.5 text-slate-400 font-semibold">Indicador</th>
          <th className="px-3 py-1.5 text-invictus-700 font-semibold text-center">Evaluación 1</th>
          <th className="px-3 py-1.5 text-blue-700 font-semibold text-center">Evaluación 2</th>
        </tr>
      </thead>
      <tbody>
        {filas.map(([label, v1, v2]) => (
          <tr key={label} className="border-b border-gray-50">
            <td className="px-3 py-1.5 text-slate-600">{label}</td>
            <td className="px-3 py-1.5 text-center font-medium text-[#172033]">{v1}</td>
            <td className="px-3 py-1.5 text-center font-medium text-blue-700">{v2}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default HistorialEvaluaciones;
