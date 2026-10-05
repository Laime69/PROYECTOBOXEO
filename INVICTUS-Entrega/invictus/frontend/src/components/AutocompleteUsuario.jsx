import { useState, useMemo, useEffect, useRef } from 'react';

function AutocompleteUsuario({ texto, onTexto, usuarios, onSubmit, placeholder = 'Nombre, correo o CI...' }) {
  const [abierto, setAbierto] = useState(false);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const sugerenciasRef = useRef(null);

  const sugerencias = useMemo(() => {
    const q = texto.trim().toLowerCase();
    if (!q) return [];
    return (usuarios || [])
      .filter((a) => `${a.nombre || ''} ${a.correo || ''} ${a.ci || ''} ${a.celular || ''}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [usuarios, texto]);

  const seleccionarUsuario = (usuario) => {
    onTexto(usuario.nombre || '');
    setAbierto(false);
    setIdx(0);
  };

  useEffect(() => {
    const manejarClick = (e) => {
      const enInput = inputRef.current?.contains(e.target);
      const enSugerencias = sugerenciasRef.current?.contains(e.target);
      if (!enInput && !enSugerencias) setAbierto(false);
    };
    document.addEventListener('mousedown', manejarClick);
    return () => document.removeEventListener('mousedown', manejarClick);
  }, []);

  const manejarTecla = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!abierto) {
        setAbierto(true);
        return;
      }
      setIdx((i) => Math.min(i + 1, sugerencias.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (abierto && sugerencias[idx]) {
        e.preventDefault();
        seleccionarUsuario(sugerencias[idx]);
      } else {
        setAbierto(false);
        onSubmit?.();
      }
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  const limpiar = () => {
    onTexto('');
    setAbierto(false);
    setIdx(0);
  };

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={texto}
        onChange={(e) => {
          onTexto(e.target.value);
          setAbierto(true);
          setIdx(0);
        }}
        onFocus={() => { if (sugerencias.length > 0) setAbierto(true); }}
        onKeyDown={manejarTecla}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-invictus-500"
      />
      {texto && (
        <button type="button" onClick={limpiar} title="Limpiar búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none">
          ✕
        </button>
      )}
      {abierto && sugerencias.length > 0 && (
        <ul ref={sugerenciasRef} className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl">
          {sugerencias.map((a, i) => (
            <li key={a.id_usuario}>
              <button type="button" onMouseEnter={() => setIdx(i)} onClick={() => seleccionarUsuario(a)}
                className={`w-full text-left px-3 py-2 text-sm border-b border-gray-50 last:border-0 ${
                  i === idx ? 'bg-invictus-50 text-invictus-800 font-medium' : 'text-[#172033]'
                }`}>
                <span className="block">{a.nombre}</span>
                <span className="block text-xs text-slate-400">
                  {a.correo || '—'}{a.ci ? ` · CI: ${a.ci}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AutocompleteUsuario;