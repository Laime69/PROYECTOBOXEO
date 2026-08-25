import { useEffect } from 'react';

/**
 * Principio UX: Contexto — la pestaña del navegador siempre refleja
 * dónde está el usuario (página + academia).
 */
export function useTituloPagina(titulo) {
  useEffect(() => {
    if (!titulo) return undefined;
    document.title = `${titulo} — INVICTUS Boxeo Academy`;
    return () => {
      document.title = 'INVICTUS Boxeo Academy';
    };
  }, [titulo]);
}

export default useTituloPagina;
