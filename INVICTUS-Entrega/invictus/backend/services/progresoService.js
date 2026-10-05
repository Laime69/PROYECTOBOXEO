const pool = require('../config/database');
const Progreso = require('../models/Progreso');
const AlumnoHorario = require('../models/AlumnoHorario');
const bitacoraService = require('./bitacoraService');

const NIVELES_EVALUACION = ['inicial', 'basico', 'intermedio', 'avanzado', 'competitivo'];
const NIVELES_DEPORTIVOS = ['principiante', 'intermedio', 'avanzado', 'competitivo'];
const TIPOS_EVALUACION = ['inicial', 'mensual', 'trimestral', 'especial', 'competencia'];
const MARGEN_ESTABLE = 3; // puntos porcentuales

// Categorías de peso genéricas en kg
function _calcularCategoriaPeso(peso) {
  if (peso == null || peso <= 0) return 'Sin categoría';
  if (peso <= 52) return 'Mosca';
  if (peso <= 57) return 'Gallo';
  if (peso <= 60) return 'Pluma';
  if (peso <= 63.5) return 'Ligero';
  if (peso <= 67) return 'Superligero';
  if (peso <= 71) return 'Welter';
  if (peso <= 75) return 'Superwelter';
  if (peso <= 80) return 'Medio';
  if (peso <= 86) return 'Semipesado';
  return 'Pesado';
}

// Determina estado del progreso según porcentaje actual vs anterior
function _estadoProgreso(porcentajeActual, porcentajeAnterior) {
  if (porcentajeActual == null) return 'Sin evaluación';
  if (porcentajeAnterior == null) return 'Primera evaluación';
  if (porcentajeActual - porcentajeAnterior > MARGEN_ESTABLE) return 'Mejorando';
  if (porcentajeAnterior - porcentajeActual > MARGEN_ESTABLE) return 'Requiere atención';
  return 'Estable';
}

class ProgresoService {
  async list(filtros, currentUser) {
    const query = { ...filtros };
    delete query.turno;
    delete query.busqueda;

    if (currentUser.rol === 'Entrenador') {
      const horarios = await AlumnoHorario.findAll({ entrenador_id: currentUser.id_entrenador, estado: 'activo' });
      const alumnoIds = [...new Set(horarios.map(h => h.alumno_id))];
      if (alumnoIds.length === 0) return [];
      query.alumno_ids = alumnoIds;
    }

    const registros = await Progreso.findAll(query);
    return registros;
  }

  // Lista alumnos con su último progreso (para tabla principal)
  async listarAlumnos(filtros, currentUser) {
    if (currentUser.rol === 'Entrenador') {
      const horarios = await AlumnoHorario.findAll({ entrenador_id: currentUser.id_entrenador, estado: 'activo' });
      const alumnoIds = [...new Set(horarios.map(h => h.alumno_id))];
      if (alumnoIds.length === 0) return [];
      filtros = { ...filtros };
      // Reutilizamos listarAlumnosConUltimoProgreso agregando restricción por alumno
      const rows = await Progreso.listarAlumnosConUltimoProgreso(filtros);
      return rows.filter(r => alumnoIds.includes(r.alumno_id));
    }
    return Progreso.listarAlumnosConUltimoProgreso(filtros);
  }

  async create(data, currentUser) {
    const { alumno_id } = data;
    if (!alumno_id) {
      throw new Error('alumno_id es requerido');
    }

    await this._validarFechaEvaluacion(data, true);
    this._validarIndicadores(data);

    if (currentUser.rol === 'Entrenador') {
      await this._verificarEntrenadorPoseeAlumno(currentUser.id_entrenador, alumno_id);
    }

    // Obtener la última evaluación para calcular peso_anterior y comparar
    const historial = await Progreso.findByAlumno(alumno_id, 1);
    const anterior = historial[0] || null;

    const peso = data.peso != null && data.peso > 0 ? Number(data.peso) : null;
    const categoriaPeso = _calcularCategoriaPeso(peso);

    let nivel = data.nivel;
    if (!nivel) {
      nivel = this._calcularNivel(data);
    }

    const nivelDeportivo = data.nivel_deportivo || anterior?.nivel_deportivo || 'principiante';

    const progreso = await Progreso.crear({
      ...data,
      entrenador_id: data.entrenador_id || currentUser.id_entrenador,
      nivel,
      nivel_deportivo: nivelDeportivo,
      categoria_peso: categoriaPeso,
      peso,
      peso_anterior: anterior?.peso || null,
    });

    // Recalcular y persistir los promedios (fueron calculados en crear pero sin devolver)
    const completo = await Progreso.findById(progreso.id);
    const promedios = Progreso.calcularPromedios(completo);
    await Progreso.update(progreso.id, {
      promedio_tecnica_ofensiva: promedios.promedioAreas.tecnica_ofensiva,
      promedio_tecnica_defensiva: promedios.promedioAreas.tecnica_defensiva,
      promedio_desplazamiento: promedios.promedioAreas.desplazamiento,
      promedio_condicion_fisica: promedios.promedioAreas.condicion_fisica,
      promedio_sparring_tactica: promedios.promedioAreas.sparring_tactica,
      promedio_disciplina: promedios.promedioAreas.disciplina,
      promedio_general: promedios.promedioGeneral,
      porcentaje_progreso: promedios.porcentajeProgreso,
    });

    const final = await Progreso.findById(progreso.id);

    // Sincronizar peso y nivel deportivo del perfil (la nueva evaluación es la más reciente)
    await this._sincronizarPerfil(alumno_id, { peso, nivel_deportivo: nivelDeportivo });

    bitacoraService.registrar({
      usuario_id: currentUser.id_usuario,
      rol: currentUser.rol,
      accion: 'CREATE',
      modulo: 'Progreso',
      descripcion: `Se registró una evaluación de progreso para el alumno`,
    });

    return final;
  }

  async update(id, data, currentUser) {
    const existente = await Progreso.findById(id);
    if (!existente) throw new Error('Evaluación no encontrada');

    await this._validarFechaEvaluacion(data, false, existente.fecha_evaluacion);
    this._validarIndicadores(data);

    if (currentUser.rol === 'Entrenador') {
      await this._verificarEntrenadorPoseeAlumno(currentUser.id_entrenador, existente.alumno_id);
    }

    // Mezclar datos existentes con los nuevos para el cálculo
    const combinado = { ...existente, ...data };

    let nivel = data.nivel;
    if (!nivel && (data.tecnica !== undefined || data.jab !== undefined || Object.keys(data).some(k => Progreso.SCORE_COLUMNS.includes(k)))) {
      nivel = this._calcularNivel(combinado);
    }

    const peso = combinado.peso != null && combinado.peso > 0 ? Number(combinado.peso) : (existente.peso || null);
    const categoriaPeso = _calcularCategoriaPeso(peso);

    const updateData = { ...data, nivel, categoria_peso: categoriaPeso };

    // Recalcular promedios
    const promedios = Progreso.calcularPromedios({ ...existente, ...updateData });
    updateData.promedio_tecnica_ofensiva = promedios.promedioAreas.tecnica_ofensiva;
    updateData.promedio_tecnica_defensiva = promedios.promedioAreas.tecnica_defensiva;
    updateData.promedio_desplazamiento = promedios.promedioAreas.desplazamiento;
    updateData.promedio_condicion_fisica = promedios.promedioAreas.condicion_fisica;
    updateData.promedio_sparring_tactica = promedios.promedioAreas.sparring_tactica;
    updateData.promedio_disciplina = promedios.promedioAreas.disciplina;
    updateData.promedio_general = promedios.promedioGeneral;
    updateData.porcentaje_progreso = promedios.porcentajeProgreso;

    const updated = await Progreso.update(id, updateData);

    // Solo la evaluación más reciente actualiza el peso/nivel deportivo del perfil
    if (await Progreso.esUltimaEvaluacion(existente.alumno_id, id)) {
      await this._sincronizarPerfil(existente.alumno_id, {
        peso: data.peso,
        nivel_deportivo: data.nivel_deportivo,
      });
    }

    bitacoraService.registrar({
      usuario_id: currentUser.id_usuario,
      rol: currentUser.rol,
      accion: 'UPDATE',
      modulo: 'Progreso',
      descripcion: `Se modificó la evaluación de progreso #${id}`,
    });

    return updated;
  }

  async remove(id, currentUser) {
    const existente = await Progreso.findById(id);
    if (!existente) throw new Error('Evaluación no encontrada');

    if (currentUser.rol === 'Entrenador') {
      await this._verificarEntrenadorPoseeAlumno(currentUser.id_entrenador, existente.alumno_id);
    }

    const fueUltima = await Progreso.esUltimaEvaluacion(existente.alumno_id, id);
    const resultado = await Progreso.deleteById(id);

    // Si se eliminó la más reciente, el perfil vuelve a sincronizarse con la anterior
    if (fueUltima) {
      const historial = await Progreso.findByAlumno(existente.alumno_id, 1);
      const nuevaUltima = historial[0] || null;
      await this._sincronizarPerfil(existente.alumno_id, {
        peso: nuevaUltima?.peso,
        nivel_deportivo: nuevaUltima?.nivel_deportivo,
      });
    }

    bitacoraService.registrar({
      usuario_id: currentUser.id_usuario,
      rol: currentUser.rol,
      accion: 'DELETE',
      modulo: 'Progreso',
      descripcion: `Se eliminó la evaluación de progreso #${id}`,
    });

    if (!resultado) throw new Error('No se pudo eliminar la evaluación');
    return resultado;
  }

  async getHistorial(alumnoId, currentUser) {
    if (currentUser.rol === 'Alumno') {
      if (!currentUser.alumno_id) {
        throw new Error('No puedes ver el progreso de otro alumno');
      }
      alumnoId = currentUser.alumno_id;
    }

    if (currentUser.rol === 'Entrenador') {
      await this._verificarEntrenadorPoseeAlumno(currentUser.id_entrenador, alumnoId);
    }

    const registros = await Progreso.findByAlumno(alumnoId);

    // Añadir estado de progreso comparando con la anterior
    const conEstado = registros.map((r, idx) => {
      const anterior = registros[idx + 1] || null;
      return {
        ...r,
        estado_progreso: _estadoProgreso(r.porcentaje_progreso, anterior?.porcentaje_progreso),
        diff_porcentaje: anterior && r.porcentaje_progreso != null
          ? Math.round((r.porcentaje_progreso - anterior.porcentaje_progreso) * 100) / 100
          : null,
      };
    });

    return conEstado;
  }

  async getMisProgresos(currentUser) {
    const registros = await Progreso.findByAlumno(currentUser.alumno_id);
    const conEstado = registros.map((r, idx) => {
      const anterior = registros[idx + 1] || null;
      return {
        ...r,
        estado_progreso: _estadoProgreso(r.porcentaje_progreso, anterior?.porcentaje_progreso),
      };
    });
    const ultimo = conEstado.length > 0 ? conEstado[0] : null;
    return {
      ultima_evaluacion: ultimo,
      historial: conEstado,
      total_evaluaciones: conEstado.length,
    };
  }

  async getPerfilProgreso(alumnoId, currentUser) {
    if (currentUser.rol === 'Alumno') {
      if (!currentUser.alumno_id) {
        throw new Error('No puedes ver el progreso de otro alumno');
      }
      alumnoId = currentUser.alumno_id;
    }
    if (currentUser.rol === 'Entrenador') {
      await this._verificarEntrenadorPoseeAlumno(currentUser.id_entrenador, alumnoId);
    }

    const alumnos = await Progreso.listarAlumnosConUltimoProgreso({});
    const alumno = alumnos.find(a => a.alumno_id === parseInt(alumnoId, 10));

    const historial = await this.getHistorial(alumnoId, currentUser);
    const ultima = historial[0] || null;
    const anterior = historial[1] || null;

    const estado = _estadoProgreso(ultima?.porcentaje_progreso, anterior?.porcentaje_progreso);
    const diff = ultima && anterior && ultima.porcentaje_progreso != null && anterior.porcentaje_progreso != null
      ? Math.round((ultima.porcentaje_progreso - anterior.porcentaje_progreso) * 100) / 100
      : null;

    return {
      alumno: alumno ? {
        alumno_id: alumno.alumno_id,
        alumno_nombre: alumno.alumno_nombre,
        alumno_correo: alumno.alumno_correo,
        alumno_ci: alumno.alumno_ci,
        fecha_nacimiento: alumno.fecha_nacimiento,
        nivel_deportivo: alumno.nivel_deportivo,
        peso_actual: alumno.peso_actual,
        fecha_inscripcion: alumno.fecha_inscripcion,
        estado_pago: alumno.estado_pago,
        contacto_emergencia: alumno.contacto_emergencia,
        celular_contacto_emergencia: alumno.celular_contacto_emergencia,
        objetivo_entrenamiento: alumno.objetivo_entrenamiento,
        observacion_medica: alumno.observacion_medica,
        nombre_turno: alumno.nombre_turno,
        entrenador_nombre: alumno.entrenador_nombre,
        porcentaje_asistencia: alumno.porcentaje_asistencia,
      } : null,
      ultima_evaluacion: ultima,
      estado_progreso: estado,
      diferencia: diff,
      promedios_areas: ultima ? {
        tecnica_ofensiva: ultima.promedio_tecnica_ofensiva,
        tecnica_defensiva: ultima.promedio_tecnica_defensiva,
        desplazamiento: ultima.promedio_desplazamiento,
        condicion_fisica: ultima.promedio_condicion_fisica,
        sparring_tactica: ultima.promedio_sparring_tactica,
        disciplina: ultima.promedio_disciplina,
      } : null,
      historial,
    };
  }

  async getGraficosData(alumnoId, currentUser) {
    if (currentUser.rol === 'Alumno') {
      if (!currentUser.alumno_id) {
        throw new Error('No puedes ver el progreso de otro alumno');
      }
      alumnoId = currentUser.alumno_id;
    }
    if (currentUser.rol === 'Entrenador') {
      await this._verificarEntrenadorPoseeAlumno(currentUser.id_entrenador, alumnoId);
    }

    const registros = await Progreso.findByAlumno(alumnoId);

    const evolucionPromedio = registros.map(r => ({
      fecha: r.fecha_evaluacion,
      promedio: r.promedio_general,
      porcentaje: r.porcentaje_progreso,
    })).reverse();

    const evolucionPeso = registros.map(r => ({
      fecha: r.fecha_evaluacion,
      peso: r.peso,
    })).reverse();

    return {
      evolucion_promedio: evolucionPromedio,
      evolucion_peso: evolucionPeso,
      ultima_areas: registros[0] ? {
        tecnica_ofensiva: registros[0].promedio_tecnica_ofensiva,
        tecnica_defensiva: registros[0].promedio_tecnica_defensiva,
        desplazamiento: registros[0].promedio_desplazamiento,
        condicion_fisica: registros[0].promedio_condicion_fisica,
        sparring_tactica: registros[0].promedio_sparring_tactica,
        disciplina: registros[0].promedio_disciplina,
      } : null,
    };
  }

  async getResumen(filtros, currentUser) {
    const resumen = await Progreso.getResumenGeneral(filtros);
    const alumnos = await this.listarAlumnos(filtros, currentUser);

    const conPromedio = alumnos.filter(a => a.promedio_general != null);
    conPromedio.sort((a, b) => (b.promedio_general || 0) - (a.promedio_general || 0));
    const mejorProgreso = conPromedio.slice(0, 5).map(a => ({
      alumno_id: a.alumno_id,
      alumno_nombre: a.alumno_nombre,
      promedio: a.promedio_general,
    }));

    const conPorcentaje = alumnos.filter(a => a.porcentaje_progreso != null);
    conPorcentaje.sort((a, b) => (a.porcentaje_progreso || 0) - (b.porcentaje_progreso || 0));
    const bajoProgreso = conPorcentaje.slice(0, 5).map(a => ({
      alumno_id: a.alumno_id,
      alumno_nombre: a.alumno_nombre,
      promedio: a.promedio_general,
      porcentaje: a.porcentaje_progreso,
    }));

    // Contar estados
    const contadores = {
      mejorando: 0,
      estable: 0,
      atencion: 0,
      sin_evaluacion: 0,
      primera: 0,
    };
    alumnos.forEach((a) => {
      if (a.promedio_general == null) {
        contadores.sin_evaluacion++;
      } else if (a.porcentaje_anterior == null) {
        contadores.primera++;
      } else if (a.porcentaje_progreso - a.porcentaje_anterior > MARGEN_ESTABLE) {
        contadores.mejorando++;
      } else if (a.porcentaje_anterior - a.porcentaje_progreso > MARGEN_ESTABLE) {
        contadores.atencion++;
      } else {
        contadores.estable++;
      }
    });

    return {
      ...resumen,
      alumnos,
      mejor_progreso: mejorProgreso,
      bajo_progreso: bajoProgreso,
      estados: contadores,
    };
  }

  async comparar(id1, id2, currentUser) {
    const uno = await Progreso.findById(id1);
    const dos = await Progreso.findById(id2);
    if (!uno || !dos) throw new Error('Evaluación no encontrada');
    if (uno.alumno_id !== dos.alumno_id) throw new Error('Las evaluaciones deben ser del mismo alumno');

    if (currentUser.rol === 'Alumno' && currentUser.alumno_id !== uno.alumno_id) {
      throw new Error('No puedes ver el progreso de otro alumno');
    }
    if (currentUser.rol === 'Entrenador') {
      await this._verificarEntrenadorPoseeAlumno(currentUser.id_entrenador, uno.alumno_id);
    }

    return { evaluacion_1: uno, evaluacion_2: dos };
  }

  // ── Helpers privados ────────────────────────────────────────

  async _verificarEntrenadorPoseeAlumno(entrenadorId, alumnoId) {
    const horarios = await AlumnoHorario.findAll({ entrenador_id: entrenadorId, estado: 'activo' });
    const alumnoIds = [...new Set(horarios.map(h => h.alumno_id))];
    if (!alumnoIds.includes(alumnoId)) {
      throw new Error('No puedes acceder al progreso de un alumno que no te corresponde');
    }
  }

  async _sincronizarPerfil(alumnoId, datos) {
    const campos = [];
    const params = [];
    let idx = 1;

    if (datos.peso != null && datos.peso > 0) {
      campos.push(`peso_actual = $${idx++}`);
      params.push(Number(datos.peso));
    }
    if (datos.nivel_deportivo && NIVELES_DEPORTIVOS.includes(datos.nivel_deportivo)) {
      campos.push(`nivel_deportivo = $${idx++}`);
      params.push(datos.nivel_deportivo);
    }
    if (campos.length === 0) return;

    params.push(alumnoId);
    await pool.query(
      `UPDATE alumnos SET ${campos.join(', ')}, updated_at = NOW() WHERE id_alumno = $${idx}`,
      params
    );
  }

  async _validarFechaEvaluacion(data, esCreate, fechaExistente = null) {
    const { rows } = await pool.query('SELECT CURRENT_DATE::text AS hoy');
    const hoy = rows[0]?.hoy;
    const fechaEnviada = data.fecha_evaluacion ? String(data.fecha_evaluacion).slice(0, 10) : null;
    const aISO = (valor) => {
      if (!valor) return null;
      if (valor instanceof Date) {
        return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}`;
      }
      return String(valor).slice(0, 10);
    };
    if (esCreate) {
      if (fechaEnviada && fechaEnviada !== hoy) {
        throw new Error('La fecha de la evaluación debe ser el día de hoy');
      }
    } else if (fechaEnviada && aISO(fechaExistente) !== null && fechaEnviada !== aISO(fechaExistente)) {
      throw new Error('La fecha de la evaluación debe ser la fecha original registrada');
    }
  }

  _validarIndicadores(data) {
    const campos = Progreso.SCORE_COLUMNS;
    for (const campo of campos) {
      const val = data[campo];
      if (val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (isNaN(num) || num < 1 || num > 10) {
          throw new Error(`${campo} debe ser un número entre 1 y 10`);
        }
      }
    }
    // Validación de tipo de evaluación
    if (data.tipo_evaluacion && !TIPOS_EVALUACION.includes(data.tipo_evaluacion)) {
      throw new Error('Tipo de evaluación inválido');
    }
    // Validación de peso
    if (data.peso !== undefined && data.peso !== null && data.peso !== '') {
      const num = Number(data.peso);
      if (isNaN(num) || num <= 0) {
        throw new Error('El peso debe ser mayor que cero');
      }
    }
  }

  _calcularNivel(data) {
    const campos = Progreso.SCORE_COLUMNS.filter((c) => {
      const v = data[c];
      return v != null && v !== '' && Number.isFinite(Number(v));
    });
    if (campos.length === 0) return 'basico';

    const suma = campos.reduce((acc, c) => acc + Number(data[c]), 0);
    const promedio = suma / campos.length;

    if (promedio < 4) return 'inicial';
    if (promedio < 6) return 'basico';
    if (promedio < 8) return 'intermedio';
    if (promedio < 9.5) return 'avanzado';
    return 'competitivo';
  }

  _calcularCategoriaPeso = _calcularCategoriaPeso;
}

module.exports = new ProgresoService();
