const nombresTurno = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };
const iconosTurno = { manana: '🌅', tarde: '☀️', noche: '🌙' };

function ClasesHoyCard({ clases_hoy, clases_hoy_detalles = [], dia_nombre = '', horarios_semana }) {
  const activas = clases_hoy?.activas ?? 0;
  const total = clases_hoy?.total ?? 0;
  const esSparring = clases_hoy?.es_sparring ?? false;
  const texto = clases_hoy?.texto ?? 'Sin clases hoy';
  const esFinDeSemana = total === 0 && activas === 0;

  const semanaActivos = horarios_semana?.activos ?? 0;
  const semanaTotal = horarios_semana?.total ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6 transition-all duration-200 hover:shadow-card-hover">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-slate-500 font-medium">Clases Hoy</p>
          {dia_nombre && <span className="text-xs text-gray-400 capitalize">{dia_nombre}</span>}
        </div>

        {esFinDeSemana ? (
          <div className="flex items-center gap-3 mt-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">📅</div>
            <div>
              <p className="text-xl font-bold text-gray-400">Sin clases hoy</p>
              <p className="text-xs text-gray-400 mt-0.5">Domingo / Sábado</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold text-[#172033]">{activas}/{total}</p>
              {esSparring ? (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">Sparring</span>
              ) : (
                <span className="text-sm text-slate-500">activas</span>
              )}
            </div>

            {clases_hoy_detalles.length > 0 && (
              <div className="mt-4 space-y-2">
                {clases_hoy_detalles.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span>{iconosTurno[c.turno] || '🕐'}</span>
                      <span className="font-medium text-gray-700">{nombresTurno[c.turno] || c.turno}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-slate-500">{String(c.hora_inicio).slice(0,5)} - {String(c.hora_fin).slice(0,5)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.entrenador_nombre && (
                        <span className="text-gray-400 text-xs hidden sm:inline">{c.entrenador_nombre}</span>
                      )}
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        c.tipo_actividad === 'sparring'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {c.tipo_actividad === 'sparring' ? 'Sparring' : 'Entrenamiento'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 p-6 transition-all duration-200 hover:shadow-card-hover">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-slate-500 font-medium">Horarios Semana</p>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-3xl font-bold text-[#172033]">{semanaActivos}/{semanaTotal}</p>
          <span className="text-sm text-slate-500">activos</span>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${semanaTotal > 0 && semanaActivos === semanaTotal ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${semanaTotal > 0 ? (semanaActivos / semanaTotal) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {semanaTotal > 0 && semanaActivos === semanaTotal
              ? 'Todos los bloques activos'
              : `${semanaTotal - semanaActivos} bloque${semanaTotal - semanaActivos !== 1 ? 's' : ''} inactivo${semanaTotal - semanaActivos !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ClasesHoyCard;
