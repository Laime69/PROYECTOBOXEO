const ESTILOS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; background: #fff; }
  .pagina { max-width: 820px; margin: 0 auto; padding: 40px 48px; }

  /* Encabezado institucional */
  .encabezado { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1a1a1a; padding-bottom: 12px; }
  .marca { font-size: 24px; font-weight: bold; letter-spacing: 4px; }
  .marca-sub { color: #777; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
  .codigo-doc { text-align: right; font-size: 10px; color: #666; line-height: 1.6; }
  .codigo-doc strong { color: #1a1a1a; }

  .titulo-reporte { text-align: center; margin-top: 26px; padding-bottom: 8px; font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; }
  .periodo { text-align: center; color: #555; font-size: 12px; margin: 6px 0 18px; }

  /* Filtros aplicados */
  .filtros { border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; margin-bottom: 18px; background: #fafafa; }
  .filtros-titulo { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #555; font-weight: bold; margin-bottom: 6px; }
  .filtros-lista { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 11px; color: #333; }
  .filtro-item span { color: #777; }

  /* Resumen de indicadores */
  .resumen { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 22px; }
  .caja { border: 1px solid #bbb; border-radius: 6px; padding: 10px 16px; text-align: center; min-width: 110px; }
  .caja .num { font-size: 19px; font-weight: bold; display: block; }
  .caja .lbl { font-size: 9.5px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Tablas */
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { background: #1a1a1a; color: #fff; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 8px; text-align: left; }
  td { border-bottom: 1px solid #ddd; padding: 6px 8px; font-size: 12px; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #f6f6f6; }
  .seccion { font-size: 13.5px; font-weight: bold; border-left: 4px solid #1a1a1a; padding-left: 8px; margin: 20px 0 4px; }
  .seccion-nota { font-size: 10px; color: #888; font-style: italic; margin: 2px 0 8px; }
  .vacio td { text-align: center; color: #999; padding: 14px; font-style: italic; }

  /* Pie del documento */
  .pie { margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 10px; font-size: 10px; color: #999; display: flex; justify-content: space-between; gap: 12px; }
  .firma { margin-top: 46px; display: flex; justify-content: space-around; gap: 40px; }
  .firma-linea { border-top: 1px solid #444; width: 220px; text-align: center; font-size: 11px; padding-top: 5px; color: #444; }

  @page { size: A4; margin: 14mm; }
  @media print { .pagina { padding: 0; } }

  /* Compatibilidad de impresión: encabezados repetidos y filas completas por página */
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  .seccion { page-break-after: avoid; }
  .resumen, .filtros { page-break-inside: avoid; }

  /* Gráficos SVG */
  .grafico-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px 6px; margin-bottom: 16px; page-break-inside: avoid; }
  .grafico-titulo { font-size: 12.5px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
  .grafico-nota { font-size: 9.5px; color: #9ca3af; font-style: italic; margin: 2px 0 8px; text-align: center; }
`;

function escapar(valor) {
  return String(valor ?? '—').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const hoyIso = () => new Date().toISOString().slice(0, 10);

function _formatearNum(valor, unidad = '') {
  const num = Number(valor);
  if (!Number.isFinite(num)) return '—';
  const dec = num % 1 !== 0 ? 1 : 0;
  return num.toFixed(dec).replace('.', ',') + (unidad === '%' ? '%' : unidad ? ` ${unidad}` : '');
}

// Gráfico de líneas (SVG puro, sin librerías)
function _svgLinea(g, validos) {
  const { color = '#00A878', unidad = '', maximo = null, titulo = '' } = g;
  const ancho = 780;
  const alto = 230;
  const padIzq = 52;
  const padDer = 30;
  const padTop = 26;
  const padInf = 44;
  const innerW = ancho - padIzq - padDer;
  const innerH = alto - padTop - padInf;
  const n = validos.length;
  const max = maximo || Math.ceil(Math.max(...validos.map((v) => v.valor)) * 1.15) || 1;
  const min = 0;
  const px = (i) => padIzq + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const py = (v) => padTop + innerH - ((v - min) / (max - min)) * innerH;

  let grid = '';
  for (let k = 0; k <= 4; k++) {
    const v = min + ((max - min) * k) / 4;
    const y = py(v);
    grid += `<line x1="${padIzq}" y1="${y}" x2="${ancho - padDer}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>
      <text x="${padIzq - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#9ca3af">${_formatearNum(v, unidad)}</text>`;
  }

  const pasoEtiqueta = Math.ceil(n / 8);
  const etiquetas = validos
    .map((p, i) => {
      if (i % pasoEtiqueta !== 0 && i !== n - 1) return '';
      return `<text x="${px(i)}" y="${alto - 14}" text-anchor="middle" font-size="11" fill="#6b7280">${escapar(p.etiqueta)}</text>`;
    })
    .join('');

  const puntosStr = validos.map((p, i) => `${px(i)},${py(p.valor)}`).join(' ');

  const puntos = validos
    .map((p, i) => {
      if (n > 12 && i % pasoEtiqueta !== 0 && i !== n - 1) return '';
      return `<circle cx="${px(i)}" cy="${py(p.valor)}" r="3.5" fill="${color}"/>
        <text x="${px(i)}" y="${py(p.valor) - 9}" text-anchor="middle" font-size="10.5" font-weight="bold" fill="${color}">${_formatearNum(p.valor, unidad)}</text>`;
    })
    .join('');

  return `<div class="grafico-box">
    <div class="grafico-titulo">${escapar(titulo)}</div>
    <svg viewBox="0 0 ${ancho} ${alto}" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      ${grid}
      <polyline points="${puntosStr}" fill="none" stroke="${color}" stroke-width="2.5"/>
      ${puntos}
      ${etiquetas}
    </svg>
  </div>`;
}

// Gráfico radar de áreas (SVG puro)
function _svgRadar(g) {
  const { categorias = [], valores = [], color = '#00A878', maximo = 10, titulo = '' } = g;
  const n = categorias.length;
  if (n === 0) return '';
  const ancho = 500;
  const alto = 280;
  const cx = ancho / 2;
  const cy = alto / 2 + 10;
  const R = Math.min(ancho, alto) / 2 - 52;
  const angulo = (i) => (2 * Math.PI * i) / n - Math.PI / 2;
  const punto = (i, frac) => [cx + Math.cos(angulo(i)) * R * frac, cy + Math.sin(angulo(i)) * R * frac];
  const fracVal = (i) => {
    const v = Number(valores[i]);
    if (!Number.isFinite(v) || v <= 0) return 0;
    return Math.min(v / maximo, 1);
  };

  let anillos = '';
  [0.25, 0.5, 0.75, 1].forEach((fr) => {
    const pts = categorias.map((_, i) => punto(i, fr).join(',')).join(' ');
    anillos += `<polygon points="${pts}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  });

  let ejes = '';
  let etiquetas = '';
  categorias.forEach((c, i) => {
    const [ex, ey] = punto(i, 1);
    ejes += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#e2e8f0" stroke-width="1"/>`;
    const [lx, ly] = punto(i, 1.24);
    const ajuste = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end';
    etiquetas += `<text x="${lx}" y="${ly}" text-anchor="${ajuste}" font-size="11" font-weight="600" fill="#374151" dominant-baseline="middle">${escapar(c)}</text>`;
  });

  const dataPts = categorias.map((_, i) => punto(i, fracVal(i)).join(',')).join(' ');
  const puntos = categorias
    .map((_, i) => {
      const [dx, dy] = punto(i, fracVal(i));
      return `<circle cx="${dx}" cy="${dy}" r="3.2" fill="${color}"/>`;
    })
    .join('');

  return `<div class="grafico-box">
    <div class="grafico-titulo">${escapar(titulo)}</div>
    <svg viewBox="0 0 ${ancho} ${alto}" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      ${anillos}
      ${ejes}
      <polygon points="${dataPts}" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2"/>
      ${puntos}
      ${etiquetas}
    </svg>
    <div class="grafico-nota">Promedio de cada área, escala 0–10</div>
  </div>`;
}

function _construirGraficos(graficos) {
  return (graficos || [])
    .map((g) => {
      if (g.tipo === 'linea') {
        const validos = (g.puntos || [])
          .map((p) => ({ etiqueta: p.etiqueta ?? '', valor: Number(p.valor) }))
          .filter((p) => Number.isFinite(p.valor));
        if (validos.length === 0) return '';
        return _svgLinea(g, validos);
      }
      if (g.tipo === 'radar') {
        return _svgRadar(g);
      }
      return '';
    })
    .filter(Boolean)
    .join('');
}

export function construirDocumentoHTML({ titulo, periodo = '', filtros = [], resumen = [], graficos = [], secciones = [], generadoPor = '', notasFinales = '' }) {
  const htmlFiltros = filtros.length
    ? `<div class="filtros">
        <div class="filtros-titulo">Filtros aplicados</div>
        <div class="filtros-lista">${filtros.map((f) => `<span class="filtro-item"><span>${escapar(f.etiqueta)}:</span> ${escapar(f.valor)}</span>`).join('')}</div>
      </div>`
    : '';

  const htmlResumen = resumen.length
    ? `<div class="resumen">${resumen.map((r) => `
        <div class="caja">
          <span class="num" style="color:${escapar(r.color || '#1a1a1a')}">${escapar(r.valor)}</span>
          <span class="lbl">${escapar(r.etiqueta)}</span>
        </div>`).join('')}</div>`
    : '';

  const htmlGraficos = _construirGraficos(graficos);

  const htmlSecciones = secciones.map((s, idx) => {
    const columnas = s.columnas || [];
    const filas = s.filas || [];
    const cuerpo = filas.length
      ? filas.map((f) => `<tr>${f.map((c) => `<td>${escapar(c)}</td>`).join('')}</tr>`).join('')
      : `<tr class="vacio"><td colspan="${Math.max(columnas.length, 1)}">Sin datos para mostrar con los filtros aplicados</td></tr>`;
    return `
      ${s.titulo ? `<div class="seccion">${idx + 1}. ${escapar(s.titulo)}</div>` : ''}
      ${s.nota ? `<div class="seccion-nota">Nota. ${escapar(s.nota)}</div>` : ''}
      <table>
        <thead><tr>${columnas.map((c) => `<th>${escapar(c)}</th>`).join('')}</tr></thead>
        <tbody>${cuerpo}</tbody>
      </table>`;
  }).join('');

  const fechaGeneracion = new Date().toLocaleString('es-ES');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapar(titulo)} — INVICTUS BOXEO</title>
  <style>${ESTILOS}</style>
</head>
<body>
  <div class="pagina">
    <div class="encabezado">
      <div>
        <div class="marca">INVICTUS BOXEO</div>
        <div class="marca-sub">Academia de Boxeo — Sistema de Gestión</div>
      </div>
      <div class="codigo-doc">
        <strong>Reporte oficial del sistema</strong><br>
        Código: REP-${hoyIso()}<br>
        Generado por: ${escapar(generadoPor || 'Sistema INVICTUS')}
      </div>
    </div>
    <div class="titulo-reporte">${escapar(titulo)}</div>
    ${periodo ? `<p class="periodo">${escapar(periodo)}</p>` : ''}
    ${htmlFiltros}
    ${htmlResumen}
    ${htmlGraficos}
    ${htmlSecciones}
    ${notasFinales ? `<p style="margin-top:14px;font-size:11px;color:#555;max-width:70ch;line-height:1.6;">${escapar(notasFinales)}</p>` : ''}
    <div class="pie">
      <span>Documento generado el ${escapar(fechaGeneracion)}<br>INVICTUS Boxeo Academy — Oruro, Bolivia</span>
      <span style="text-align:right;">Uso interno administrativo<br>Página generada automáticamente</span>
    </div>
  </div>
</body>
</html>`;
}

export function imprimirHTML(html) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  const lanzar = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
  if (doc.readyState === 'complete') setTimeout(lanzar, 200);
  else iframe.onload = () => setTimeout(lanzar, 200);
}

export function imprimirDocumento(doc) {
  imprimirHTML(construirDocumentoHTML(doc));
}
