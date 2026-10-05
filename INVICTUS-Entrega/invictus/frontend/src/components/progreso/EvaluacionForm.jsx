import { useState, useEffect } from 'react';
import {
  AREAS_EVALUACION,
  TIPOS_EVALUACION,
  NOMBRES_TIPO_EVALUACION,
  NOMBRES_NIVEL_DEPORTIVO,
  NIVELES_DEPORTIVOS,
  calcularCategoriaPeso,
  calcularPromedioGeneral,
  promedioAPorcentaje,
  colorearEstrella,
} from '../../utils/progresoUtils';

const ESTADO_VACIO = (fechaHoy, alumno, nivelDeportivo) => ({
  fecha_evaluacion: fechaHoy,
  tipo_evaluacion: 'mensual',
  nivel_deportivo: nivelDeportivo || 'principiante',
  peso: '',
  observacion: '',
  fortalezas: '',
  aspectos_mejorar: '',
  recomendaciones: '',
  proximo_objetivo: '',
  proxima_evaluacion: '',
});

function EvaluacionForm({ open, onClose, alumno, evaluacion, tipo = 'create', onGuardado }) {
  const fechaHoy = (() => {
    const ahora = new Date();
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  })();
  const [form, setForm] = useState({});
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [areaActiva, setAreaActiva] = useState(0);
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (evaluacion) {
      const base = { ...evaluacion };
      base.fecha_evaluacion = String(evaluacion.fecha_evaluacion).slice(0, 10);
      delete base.alumno_nombre;
      delete base.alumno_correo;
      delete base.entrenador_nombre;
      delete base.created_at;
      delete base.updated_at;
      setForm(base);
      setDetallesAbiertos(true);
    } else {
      setForm(ESTADO_VACIO(fechaHoy, alumno, alumno?.nivel_deportivo));
      setDetallesAbiertos(false);
    }
    setErrores({});
    setAreaActiva(0);
  }, [open, evaluacion, alumno]);

  if (!open) return null;

  const setCampo = (clave, valor) => {
    setForm((prev) => ({ ...prev, [clave]: valor }));
  };

  const pesoNum = form.peso !== '' && form.peso != null ? Number(form.peso) : null;
  const categoriaPeso = calcularCategoriaPeso(pesoNum);
  const promedioGeneral = calcularPromedioGeneral(form);
  const porcentaje = promedioAPorcentaje(promedioGeneral);

  const validar = () => {
    const err = {};
    if (!form.fecha_evaluacion) err.fecha_evaluacion = 'Obligatoria';
    else if (tipo === 'create' && form.fecha_evaluacion !== fechaHoy) err.fecha_evaluacion = 'Debe ser el día de hoy';
    else if (tipo === 'edit' && evaluacion && form.fecha_evaluacion !== String(evaluacion.fecha_evaluacion).slice(0, 10)) err.fecha_evaluacion = 'No se puede modificar la fecha';
    if (!form.tipo_evaluacion) err.tipo_evaluacion = 'Selecciona tipo';
    let hayScores = false;
    AREAS_EVALUACION.forEach((area) => {
      area.campos.forEach((campo) => {
        const v = form[campo.clave];
        if (v !== undefined && v !== '' && v != null) {
          hayScores = true;
          const num = Number(v);
          if (isNaN(num) || num < 1 || num > 10) err[campo.clave] = '1-10';
        }
      });
    });
    if (!hayScores) err.general = 'Puntúa al menos un indicador (1-10)';
    if (form.peso !== '' && form.peso != null && pesoNum !== null && (isNaN(pesoNum) || pesoNum <= 0)) err.peso = 'Mayor a 0';
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    setGuardando(true);
    try {
      const payload = {
        fecha_evaluacion: form.fecha_evaluacion,
        tipo_evaluacion: form.tipo_evaluacion,
        nivel_deportivo: form.nivel_deportivo || 'principiante',
        peso: form.peso !== '' ? Number(form.peso) : null,
        observacion: form.observacion || '',
        fortalezas: form.fortalezas || '',
        aspectos_mejorar: form.aspectos_mejorar || '',
        recomendaciones: form.recomendaciones || '',
        proximo_objetivo: form.proximo_objetivo || '',
        proxima_evaluacion: form.proxima_evaluacion || null,
      };
      AREAS_EVALUACION.forEach((area) => {
        area.campos.forEach((campo) => {
          const v = form[campo.clave];
          payload[campo.clave] = v !== '' && v != null ? Number(v) : null;
        });
      });
      if (tipo === 'edit' && evaluacion) {
        payload.alumno_id = evaluacion.alumno_id;
      } else {
        payload.alumno_id = alumno.alumno_id || alumno.id_usuario;
      }
      await onGuardado(payload, tipo, evaluacion?.id);
      onClose();
    } catch {
      setErrores({ general: 'Error al guardar' });
    } finally {
      setGuardando(false);
    }
  };

  const inputBase = 'w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500';
  const areaActual = AREAS_EVALUACION[areaActiva];
  const promedioAreaActual = (() => {
    const vals = areaActual.campos
      .map((c) => form[c.clave])
      .filter((v) => v !== '' && v != null && Number(v) >= 1 && Number(v) <= 10)
      .map(Number);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  })();

  return (
    <div className="fixed inset-0 z-50 bg-[#071A2B]/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto animate-fade-in py-5">
      <div className="bg-white rounded-xl shadow-modal w-full max-w-3xl animate-scale-in max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-[#172033]">{tipo === 'edit' ? 'Editar Evaluación' : 'Registrar Evaluación'}</h3>
            <p className="text-xs text-slate-500">{alumno?.alumno_nombre || evaluacion?.alumno_nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {errores.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">{errores.general}</div>
            )}

            {/* Datos generales — compacto */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Fecha *</label>
                <input type="date" value={form.fecha_evaluacion || ''}
                  min={tipo === 'create' ? fechaHoy : undefined}
                  max={tipo === 'create' ? fechaHoy : undefined}
                  disabled={tipo !== 'create'}
                  onChange={(e) => setCampo('fecha_evaluacion', e.target.value)}
                  className={`${inputBase} ${tipo !== 'create' ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'border-gray-300'}`} />
                {errores.fecha_evaluacion && <p className="text-[10px] text-red-600">{errores.fecha_evaluacion}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Tipo *</label>
                <select value={form.tipo_evaluacion || 'mensual'} onChange={(e) => setCampo('tipo_evaluacion', e.target.value)}
                  className={`${inputBase} border-gray-300`}>
                  {TIPOS_EVALUACION.map((t) => <option key={t} value={t}>{NOMBRES_TIPO_EVALUACION[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Peso (kg)</label>
                <input type="number" step="0.1" min="0.1" placeholder="62.5" value={form.peso ?? ''} onChange={(e) => setCampo('peso', e.target.value)}
                  className={`${inputBase} border-gray-300`} />
                {errores.peso && <p className="text-[10px] text-red-600">{errores.peso}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Categoría</label>
                <input type="text" value={categoriaPeso} readOnly className={`${inputBase} bg-gray-50 text-gray-600 cursor-not-allowed`} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Nivel</label>
                <select value={form.nivel_deportivo || 'principiante'} onChange={(e) => setCampo('nivel_deportivo', e.target.value)}
                  className={`${inputBase} border-gray-300`}>
                  {NIVELES_DEPORTIVOS.map((n) => <option key={n} value={n}>{NOMBRES_NIVEL_DEPORTIVO[n]}</option>)}
                </select>
              </div>
            </div>

            {/* ── Pestañas de áreas ── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex border-b border-gray-200 overflow-x-auto text-xs">
                {AREAS_EVALUACION.map((area, idx) => {
                  const vals = area.campos.map((c) => form[c.clave]).filter((v) => v !== '' && v != null).length;
                  return (
                    <button key={area.clave} type="button" onClick={() => setAreaActiva(idx)}
                      className={`flex items-center gap-1 px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${
                        areaActiva === idx
                          ? 'border-invictus-600 text-invictus-700 font-semibold bg-invictus-50/50'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'
                      }`}>
                      <span>{area.icono}</span>
                      <span className="hidden sm:inline">{area.label}</span>
                      {vals > 0 && (
                        <span className="ml-0.5 w-4 h-4 rounded-full bg-invictus-600 text-white text-[10px] flex items-center justify-center">{vals}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#172033]">{areaActual.icono} {areaActual.label}</span>
                  <span className="text-xs">Promedio: <span className="font-bold" style={{ color: areaActual.color }}>{promedioAreaActual}</span></span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {areaActual.campos.map((campo) => (
                    <div key={campo.clave}>
                      <label className="block text-[10px] text-slate-500 mb-0.5">{campo.label}</label>
                      <input type="number" min="1" max="10" placeholder="1-10"
                        value={form[campo.clave] ?? ''}
                        onChange={(e) => setCampo(campo.clave, e.target.value)}
                        className={`w-full text-center text-sm border rounded-md px-1 py-1.5 focus:outline-none focus:ring-2 focus:ring-invictus-500 ${
                          errores[campo.clave] ? 'border-red-400'
                          : form[campo.clave] !== '' && form[campo.clave] != null
                            ? `${colorearEstrella(Number(form[campo.clave]))} font-bold border-current/20`
                            : 'border-gray-300 text-gray-700'
                        }`} />
                      {errores[campo.clave] && <p className="text-[10px] text-red-600 mt-0.5">{errores[campo.clave]}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen compacto */}
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
              <div className="text-sm">
                <span className="text-blue-600 font-medium">Promedio: </span>
                <span className="font-bold text-blue-800">{promedioGeneral ?? '—'}</span>
                <span className="text-blue-500 text-xs ml-1">/ 10</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28 h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${porcentaje ?? 0}%` }} />
                </div>
                <span className="text-sm font-bold text-blue-800 w-12 text-right">{porcentaje ?? 0}%</span>
              </div>
            </div>

            {/* Detalles opcionales colapsables */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setDetallesAbiertos((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-gray-50 transition-colors">
                <span>Observaciones y notas del entrenador</span>
                <svg className={`w-4 h-4 transition-transform ${detallesAbiertos ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {detallesAbiertos && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Fortalezas</label>
                      <textarea value={form.fortalezas || ''} onChange={(e) => setCampo('fortalezas', e.target.value)} rows={2} className={`${inputBase} border-gray-300`} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Aspectos a mejorar</label>
                      <textarea value={form.aspectos_mejorar || ''} onChange={(e) => setCampo('aspectos_mejorar', e.target.value)} rows={2} className={`${inputBase} border-gray-300`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Observaciones</label>
                      <textarea value={form.observacion || ''} onChange={(e) => setCampo('observacion', e.target.value)} rows={2} className={`${inputBase} border-gray-300`} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Recomendaciones</label>
                      <textarea value={form.recomendaciones || ''} onChange={(e) => setCampo('recomendaciones', e.target.value)} rows={2} className={`${inputBase} border-gray-300`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Próximo objetivo</label>
                      <textarea value={form.proximo_objetivo || ''} onChange={(e) => setCampo('proximo_objetivo', e.target.value)} rows={2} className={`${inputBase} border-gray-300`} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Siguiente evaluación</label>
                      <input type="date" value={form.proxima_evaluacion || ''} onChange={(e) => setCampo('proxima_evaluacion', e.target.value)}
                        className={`${inputBase} border-gray-300`} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm text-slate-500 hover:text-[#172033]">Cancelar</button>
            <button type="submit" disabled={guardando}
              className="bg-invictus-600 text-white px-5 py-1.5 rounded-lg text-sm font-medium hover:bg-invictus-700 disabled:opacity-50">
              {guardando ? 'Guardando...' : tipo === 'edit' ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EvaluacionForm;
