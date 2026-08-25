import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { menuByRole } from '../config/menuConfig';

/**
 * Command Palette (Ctrl+K) — navegación rápida y acciones,
 * inspirado en shadcn/ui. Principios UX: eficiencia y control de usuario.
 */
function CommandPalette({ open, setOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const comandos = useMemo(() => {
    const items = (menuByRole[user?.rol] || [])
      .filter((i) => !i.seccion)
      .map((i) => ({ label: i.label, icon: i.icon, path: i.path }));
    items.push({ label: 'Cerrar sesión', icon: '⏻', action: 'logout' });
    return items;
  }, [user]);

  const filtrados = useMemo(() => {
    if (!q.trim()) return comandos;
    return comandos.filter((c) => c.label.toLowerCase().includes(q.trim().toLowerCase()));
  }, [q, comandos]);

  useEffect(() => {
    if (open) {
      setQ('');
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => setIdx(0), [q]);

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-activo="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [idx, q]);

  const ejecutar = (c) => {
    setOpen(false);
    if (c.action === 'logout') logout();
    else navigate(c.path);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtrados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtrados[idx]) ejecutar(filtrados[idx]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Paleta de comandos">
      <div className="absolute inset-0 bg-[#071A2B]/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-gray-100">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar página o acción..."
            className="w-full py-3.5 text-sm bg-transparent outline-none placeholder:text-slate-400 text-[#172033]"
            aria-label="Buscar comando"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-gray-200 rounded">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
          {filtrados.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Sin resultados para «{q}»</p>
          ) : (
            filtrados.map((c, i) => (
              <button
                key={c.label}
                data-activo={i === idx}
                onMouseEnter={() => setIdx(i)}
                onClick={() => ejecutar(c)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  i === idx ? 'bg-invictus-50 text-invictus-800 font-medium' : 'text-[#172033]'
                } ${c.action === 'logout' ? 'text-red-600' : ''}`}
              >
                <span className={`w-5 text-center ${i === idx ? '' : 'opacity-70'} ${c.action === 'logout' ? 'text-red-500' : ''}`}>{c.icon}</span>
                {c.label}
                {i === idx && <span className="ml-auto text-[10px] text-slate-400">↵</span>}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 bg-slate-50 text-[10px] text-slate-400">
          <span>↑↓ navegar</span>
          <span>↵ seleccionar</span>
          <span>esc cerrar</span>
          <span className="ml-auto font-semibold text-slate-300">INVICTUS</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
