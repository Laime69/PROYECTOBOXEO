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
`;

function escapar(valor) {
  return String(valor ?? '—').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const hoyIso = () => new Date().toISOString().slice(0, 10);

export function construirDocumentoHTML({ titulo, periodo = '', filtros = [], resumen = [], secciones = [], generadoPor = '', notasFinales = '' }) {
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
