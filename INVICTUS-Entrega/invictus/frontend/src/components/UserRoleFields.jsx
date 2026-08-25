const TURNOS = [
  { key: 'manana', label: 'Mañana', horario: '09:00 - 11:00' },
  { key: 'tarde', label: 'Tarde', horario: '14:00 - 16:00' },
  { key: 'noche', label: 'Noche', horario: '19:00 - 21:00' },
];

const inputClass = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-invictus-500';
const inputError = (hasError) => hasError ? 'border-red-500' : 'border-gray-300';

function UserRoleFields({ mode, form, onChange, onTurnoChange, errors = {}, roleOptions, isSuperAdmin, turnoAsignar, turnoError, seccion = 'all' }) {
  const isCreate = mode === 'create';
  const mostrarCuenta = seccion === 'all' || seccion === 'cuenta';
  const mostrarPersonal = seccion === 'all' || seccion === 'personal';
  const mostrarRol = seccion === 'all' || seccion === 'rol';

  const calcularEdad = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const edad = calcularEdad(form.fecha_nacimiento);

  return (
    <>
      {/* ── Sección Cuenta ── */}
      {mostrarCuenta && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input type="text" name="nombre" value={form.nombre} onChange={onChange}
              placeholder="Ej: Juan Pérez" className={`${inputClass} ${inputError(errors.nombre)}`} />
            {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" name="correo" value={form.correo} onChange={onChange}
              placeholder="correo@ejemplo.com" className={`${inputClass} ${inputError(errors.correo)}`} />
            {errors.correo && <p className="mt-1 text-xs text-red-500">{errors.correo}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña {isCreate ? '' : <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>}
              </label>
              <input type="password" name="password" value={form.password} onChange={onChange}
                placeholder={isCreate ? 'Mínimo 6 caracteres' : 'Nueva contraseña'}
                className={`${inputClass} ${inputError(errors.password)}`} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {isCreate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={onChange}
                  placeholder="Repite la contraseña" className={`${inputClass} ${inputError(errors.confirmPassword)}`} />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sección Datos personales ── */}
      {mostrarPersonal && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cédula de Identidad (CI)</label>
              <input type="text" name="ci" value={form.ci} onChange={onChange}
                placeholder="Ej: 12345678" className={`${inputClass} ${inputError(errors.ci)}`} />
              {errors.ci && <p className="mt-1 text-xs text-red-500">{errors.ci}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
              <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={onChange}
                max={new Date().toISOString().split('T')[0]}
                className={`${inputClass} ${inputError(errors.fecha_nacimiento)}`} />
              {errors.fecha_nacimiento && <p className="mt-1 text-xs text-red-500">{errors.fecha_nacimiento}</p>}
              {edad !== null && !errors.fecha_nacimiento && (
                <p className="mt-1 text-xs text-slate-500">Edad: {edad} años</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
              <input type="tel" name="celular" value={form.celular} onChange={onChange}
                placeholder="Ej: 099123456" className={`${inputClass} ${inputError(errors.celular)}`} />
              {errors.celular && <p className="mt-1 text-xs text-red-500">{errors.celular}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input type="text" name="direccion" value={form.direccion} onChange={onChange}
                placeholder="Ej: Av. Principal 1234" className={`${inputClass} ${inputError(errors.direccion)}`} />
              {errors.direccion && <p className="mt-1 text-xs text-red-500">{errors.direccion}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select name="rol" value={form.rol} onChange={onChange}
                className={`${inputClass} ${inputError(errors.rol)}`}>
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {(isCreate ? isSuperAdmin : true) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select name="estado" value={form.estado || 'activo'} onChange={onChange}
                  className={`${inputClass} ${inputError(errors.estado)}`}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Secciones por rol ── */}

      {/* ── Sección: Alumno ── */}
      {mostrarRol && form.rol === 'Alumno' && (
        <>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <h4 className="font-semibold text-[#172033]">Datos de inscripción</h4>
              <p className="text-xs text-gray-400 mt-0.5">Los viernes corresponden a sparring.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inscripción</label>
                <input type="date" name="fecha_inscripcion" value={form.fecha_inscripcion} onChange={onChange}
                  className={`${inputClass} ${inputError(errors.fecha_inscripcion)}`} />
                {errors.fecha_inscripcion && <p className="mt-1 text-xs text-red-500">{errors.fecha_inscripcion}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha vencimiento</label>
                <input type="date" name="fecha_vencimiento" value={form.fecha_vencimiento} onChange={onChange}
                  className={`${inputClass} ${inputError(errors.fecha_vencimiento)}`} />
                {errors.fecha_vencimiento && <p className="mt-1 text-xs text-red-500">{errors.fecha_vencimiento}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado de pago</label>
              <select name="estado_pago" value={form.estado_pago} onChange={onChange}
                className={`${inputClass} ${inputError(errors.estado_pago)}`}>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <h4 className="font-semibold text-[#172033]">Datos deportivos</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel deportivo</label>
                <select name="nivel_deportivo" value={form.nivel_deportivo} onChange={onChange}
                  className={`${inputClass} ${inputError(errors.nivel_deportivo)}`}>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso actual (kg)</label>
                <input type="number" step="0.1" name="peso_actual" value={form.peso_actual} onChange={onChange}
                  placeholder="Ej: 75.5" className={`${inputClass} ${inputError(errors.peso_actual)}`} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo de entrenamiento</label>
              <input type="text" name="objetivo_entrenamiento" value={form.objetivo_entrenamiento} onChange={onChange}
                placeholder="Ej: Competencia amateur" className={`${inputClass} ${inputError(errors.objetivo_entrenamiento)}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observación médica</label>
              <textarea name="observacion_medica" value={form.observacion_medica} onChange={onChange} rows={2}
                placeholder="Lesiones, alergias, etc." className={`${inputClass} ${inputError(errors.observacion_medica)}`} />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <h4 className="font-semibold text-[#172033]">Turno de inscripción</h4>
              <p className="text-xs text-gray-400 mt-0.5">Los viernes corresponden a sparring.</p>
            </div>
            <div className="space-y-2">
              {TURNOS.map((t) => (
                <label key={t.key}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${turnoAsignar === t.key ? 'border-invictus-500 bg-invictus-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="turno" value={t.key} checked={turnoAsignar === t.key}
                    onChange={(e) => onTurnoChange(e.target.value)}
                    className="text-invictus-600 focus:ring-invictus-500" />
                  <div>
                    <p className="text-sm font-medium text-[#172033]">{t.label}</p>
                    <p className="text-xs text-gray-400">{t.horario} | Lunes a Viernes</p>
                  </div>
                </label>
              ))}
            </div>
            {turnoError && <p className="text-xs text-red-500">{turnoError}</p>}
          </div>
        </>
      )}

      {/* ── Sección: Entrenador ── */}
      {mostrarRol && form.rol === 'Entrenador' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-[#172033]">Datos laborales</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
              <input type="text" name="especialidad" value={form.especialidad} onChange={onChange}
                placeholder="Ej: Boxeo profesional" className={`${inputClass} ${inputError(errors.especialidad)}`} />
              {errors.especialidad && <p className="mt-1 text-xs text-red-500">{errors.especialidad}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experiencia (años)</label>
              <input type="number" name="experiencia_anios" value={form.experiencia_anios} onChange={onChange}
                min="0" className={`${inputClass} ${inputError(errors.experiencia_anios)}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de ingreso</label>
              <input type="date" name="fecha_ingreso" value={form.fecha_ingreso} onChange={onChange}
                className={`${inputClass} ${inputError(errors.fecha_ingreso)}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado laboral</label>
              <select name="estado_laboral" value={form.estado_laboral} onChange={onChange}
                className={`${inputClass} ${inputError(errors.estado_laboral)}`}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="cesado">Cesado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea name="observaciones" value={form.observaciones} onChange={onChange} rows={2}
              className={`${inputClass} ${inputError(errors.observaciones)}`} />
          </div>
        </div>
      )}

      {/* ── Sección: Recepcionista ── */}
      {mostrarRol && form.rol === 'Recepcionista' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-[#172033]">Datos laborales</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turno de trabajo</label>
              <select name="turno_trabajo" value={form.turno_trabajo} onChange={onChange}
                className={`${inputClass} ${inputError(errors.turno_trabajo)}`}>
                <option value="">Sin asignar</option>
                <option value="manana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </select>
              {errors.turno_trabajo && <p className="mt-1 text-xs text-red-500">{errors.turno_trabajo}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
              <input type="text" name="area" value={form.area} onChange={onChange} placeholder="Ej: Recepción"
                className={`${inputClass} ${inputError(errors.area)}`} />
              {errors.area && <p className="mt-1 text-xs text-red-500">{errors.area}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de ingreso</label>
              <input type="date" name="fecha_ingreso" value={form.fecha_ingreso} onChange={onChange}
                className={`${inputClass} ${inputError(errors.fecha_ingreso)}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado laboral</label>
              <select name="estado_laboral" value={form.estado_laboral} onChange={onChange}
                className={`${inputClass} ${inputError(errors.estado_laboral)}`}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="cesado">Cesado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea name="observaciones" value={form.observaciones} onChange={onChange} rows={2}
              className={`${inputClass} ${inputError(errors.observaciones)}`} />
          </div>
        </div>
      )}

      {/* ── Sección: Administrador ── */}
      {mostrarRol && form.rol === 'Administrador' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-[#172033]">Datos laborales</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <input type="text" name="cargo" value={form.cargo} onChange={onChange}
                placeholder="Ej: Administrador General" className={`${inputClass} ${inputError(errors.cargo)}`} />
              {errors.cargo && <p className="mt-1 text-xs text-red-500">{errors.cargo}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celular institucional</label>
              <input type="tel" name="celular_institucional" value={form.celular_institucional} onChange={onChange}
                className={`${inputClass} ${inputError(errors.celular_institucional)}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de ingreso</label>
              <input type="date" name="fecha_ingreso" value={form.fecha_ingreso} onChange={onChange}
                className={`${inputClass} ${inputError(errors.fecha_ingreso)}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado laboral</label>
              <select name="estado_laboral" value={form.estado_laboral} onChange={onChange}
                className={`${inputClass} ${inputError(errors.estado_laboral)}`}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="cesado">Cesado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea name="observaciones" value={form.observaciones} onChange={onChange} rows={2}
              className={`${inputClass} ${inputError(errors.observaciones)}`} />
          </div>
        </div>
      )}

      {/* ── Sección: SuperAdmin ── */}
      {mostrarRol && form.rol === 'SuperAdmin' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-[#172033]">Datos del sistema</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <input type="text" name="cargo" value={form.cargo} onChange={onChange}
                placeholder="Ej: Director" className={`${inputClass} ${inputError(errors.cargo)}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celular institucional</label>
              <input type="tel" name="celular_institucional" value={form.celular_institucional} onChange={onChange}
                className={`${inputClass} ${inputError(errors.celular_institucional)}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de ingreso</label>
              <input type="date" name="fecha_ingreso" value={form.fecha_ingreso} onChange={onChange}
                className={`${inputClass} ${inputError(errors.fecha_ingreso)}`} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea name="observaciones" value={form.observaciones} onChange={onChange} rows={2}
              className={`${inputClass} ${inputError(errors.observaciones)}`} />
          </div>
        </div>
      )}
    </>
  );
}

export default UserRoleFields;
