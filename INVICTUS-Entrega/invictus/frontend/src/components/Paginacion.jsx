function Paginacion({ total, pagina, porPagina, setPagina, setPorPagina }) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const desde = total === 0 ? 0 : (paginaSegura - 1) * porPagina + 1;
  const hasta = Math.min(total, paginaSegura * porPagina);

  const numeros = [];
  const inicio = Math.max(1, Math.min(paginaSegura - 2, totalPaginas - 4));
  const fin = Math.min(totalPaginas, inicio + 4);
  for (let i = inicio; i <= fin; i++) numeros.push(i);

  const btnBase = 'min-w-[34px] h-[34px] px-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center';

  return (
    <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          Mostrando <strong className="text-[#172033]">{desde}</strong>–<strong className="text-[#172033]">{hasta}</strong> de{' '}
          <strong className="text-[#172033]">{total}</strong> registros
        </span>
        <select
          value={porPagina}
          onChange={(e) => { setPorPagina(parseInt(e.target.value, 10)); setPagina(1); }}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-invictus-500"
          title="Filas por página"
        >
          {[5, 10, 25, 50].map((n) => (
            <option key={n} value={n}>{n} filas</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPagina(paginaSegura - 1)}
          disabled={paginaSegura <= 1}
          className={`${btnBase} ${paginaSegura <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-slate-500 hover:bg-gray-100'}`}
        >
          ‹
        </button>
        {inicio > 1 && (
          <>
            <button onClick={() => setPagina(1)} className={`${btnBase} text-slate-500 hover:bg-gray-100`}>1</button>
            {inicio > 2 && <span className="text-gray-400 px-1">…</span>}
          </>
        )}
        {numeros.map((n) => (
          <button
            key={n}
            onClick={() => setPagina(n)}
            className={`${btnBase} ${n === paginaSegura ? 'bg-invictus-600 text-white shadow-sm' : 'text-slate-500 hover:bg-gray-100'}`}
          >
            {n}
          </button>
        ))}
        {fin < totalPaginas && (
          <>
            {fin < totalPaginas - 1 && <span className="text-gray-400 px-1">…</span>}
            <button onClick={() => setPagina(totalPaginas)} className={`${btnBase} text-slate-500 hover:bg-gray-100`}>{totalPaginas}</button>
          </>
        )}
        <button
          onClick={() => setPagina(paginaSegura + 1)}
          disabled={paginaSegura >= totalPaginas}
          className={`${btnBase} ${paginaSegura >= totalPaginas ? 'text-gray-300 cursor-not-allowed' : 'text-slate-500 hover:bg-gray-100'}`}
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default Paginacion;
