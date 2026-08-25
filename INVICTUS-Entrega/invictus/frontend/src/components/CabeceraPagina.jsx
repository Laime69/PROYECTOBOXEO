function CabeceraPagina({ titulo, subtitulo, stats = [], acciones }) {
  return (
    <div className="mb-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#172033]">{titulo}</h2>
          {subtitulo && <p className="text-slate-500 mt-0.5">{subtitulo}</p>}
        </div>
        {acciones && <div className="flex items-center gap-2">{acciones}</div>}
      </div>

      {stats.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {stats.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
              <strong className={`text-sm font-bold ${s.color || 'text-[#172033]'}`}>{s.valor}</strong>
              <span className="text-slate-500">{s.etiqueta}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default CabeceraPagina;
