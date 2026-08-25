import { useEffect, useRef } from 'react';

/**
 * Fondo interactivo en canvas: red de partículas esmeralda que derivan
 * y se conectan por proximidad (efecto "red de entrenamiento").
 * Vanilla JS sobre <canvas>, sin librerías externas.
 */
function CanvasFondo() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf;

    const N = window.innerWidth < 640 ? 26 : 52;
    const puntos = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00045,
      vy: (Math.random() - 0.5) * 0.00045,
      r: Math.random() * 1.6 + 0.6,
    }));

    const redimensionar = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const dibujar = () => {
      ctx.clearRect(0, 0, w, h);
      const distMax = 130;

      for (let i = 0; i < puntos.length; i++) {
        const a = puntos[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > 1) a.vx *= -1;
        if (a.y < 0 || a.y > 1) a.vy *= -1;

        for (let j = i + 1; j < puntos.length; j++) {
          const b = puntos[j];
          const dx = (a.x - b.x) * w;
          const dy = (a.y - b.y) * h;
          const d = Math.hypot(dx, dy);
          if (d < distMax) {
            ctx.strokeStyle = `rgba(0, 168, 120, ${(1 - d / distMax) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }

        ctx.fillStyle = 'rgba(0, 168, 120, 0.45)';
        ctx.beginPath();
        ctx.arc(a.x * w, a.y * h, a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducido) raf = requestAnimationFrame(dibujar);
    };

    redimensionar();
    dibujar();
    window.addEventListener('resize', redimensionar);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', redimensionar);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default CanvasFondo;
