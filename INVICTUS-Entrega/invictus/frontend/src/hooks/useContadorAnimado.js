import { useEffect, useRef, useState } from 'react';

/**
 * Principio UX: feedback perceptible — los indicadores numéricos
 * "suben" hasta su valor con easing cúbico (requestAnimationFrame).
 * Solo anima números; textos compuestos se muestran tal cual.
 */
export function useContadorAnimado(valor, duracion = 900) {
  const [mostrado, setMostrado] = useState(0);
  const previo = useRef(0);
  const esNumero = Number.isFinite(Number(valor));

  useEffect(() => {
    if (!esNumero) return undefined;
    const destino = Number(valor) || 0;
    const desde = previo.current;
    const delta = destino - desde;
    if (delta === 0) {
      setMostrado(destino);
      return undefined;
    }

    let raf;
    const inicio = performance.now();
    const paso = (t) => {
      const p = Math.min((t - inicio) / duracion, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setMostrado(Math.round(desde + delta * eased));
      if (p < 1) raf = requestAnimationFrame(paso);
      else previo.current = destino;
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor, duracion, esNumero]);

  return esNumero ? mostrado : valor;
}

export default useContadorAnimado;
