const ESTILOS = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; max-width: 820px; margin: 30px auto; padding: 24px; color: #1a1a1a; }
  .marca { text-align: center; font-size: 22px; font-weight: bold; letter-spacing: 3px; }
  .marca-sub { text-align: center; color: #777; font-size: 11px; letter-spacing: 2px; margin-top: 2px; text-transform: uppercase; }
  .titulo-reporte { text-align: center; border-bottom: 2px solid #222; margin-top: 18px; padding-bottom: 8px; font-size: 16px; font-weight: bold; }
  .periodo { text-align: center; color: #555; font-size: 13px; margin: 6px 0 20px; }
  .resumen { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 22px; }
  .caja { border: 1px solid #bbb; border-radius: 6px; padding: 10px 18px; text-align: center; min-width: 120px; }
  .caja .num { font-size: 20px; font-weight: bold; display: block; }
  .caja .lbl { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th { background: #222; color: #fff; font-size: 11px; text-transform: uppercase; padding: 7px 8px; text-align: left; }
  td { border-bottom: 1px solid #ddd; padding: 6px 8px; font-size: 12.5px; }
  tbody tr:nth-child(even) td { background: #f5f5f5; }
  .seccion { font-size: 14px; font-weight: bold; border-left: 4px solid #222; padding-left: 8px; margin: 20px 0 8px; }
  .vacio td { text-align: center; color: #999; padding: 14px; }
  .pie { text-align: center; margin-top: 28px; font-size: 11px; color: #999; border-top: 1px dashed #ccc; padding-top: 10px; line-height: 1.6; }
`;

function escapar(valor) {
  return String(valor ?? '—').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function imprimirDocumento({ titulo, periodo = '', resumen = [], secciones = [] }) {
  const htmlResumen = resumen.length
    ? `<div class="resumen">${resumen.map((r) => `
        <div class="caja">
          <span class="num" style="color:${escapar(r.color || '#1a1a1a')}">${escapar(r.valor)}</span>
          <span class="lbl">${escapar(r.etiqueta)}</span>
        </div>`).join('')}</div>`
    : '';

  const htmlSecciones = secciones.map((s) => {
    const columnas = s.columnas || [];
    const filas = s.filas || [];
    const cuerpo = filas.length
      ? filas.map((f) => `<tr>${f.map((c) => `<td>${escapar(c)}</td>`).join('')}</tr>`).join('')
      : `<tr class="vacio"><td colspan="${columnas.length}">Sin datos para mostrar</td></tr>`;
    return `
      ${s.titulo ? `<div class="seccion">${escapar(s.titulo)}</div>` : ''}
      <table>
        <thead><tr>${columnas.map((c) => `<th>${escapar(c)}</th>`).join('')}</tr></thead>
        <tbody>${cuerpo}</tbody>
      </table>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapar(titulo)} — INVICTUS BOXEO</title>
  <style>${ESTILOS}</style>
</head>
<body>
  <div class="marca">INVICTUS BOXEO</div>
  <div class="marca-sub">Academia de Boxeo — Sistema de Gestión</div>
  <div class="titulo-reporte">${escapar(titulo)}</div>
  ${periodo ? `<p class="periodo">${escapar(periodo)}</p>` : ''}
  ${htmlResumen}
  ${htmlSecciones}
  <div class="pie">
    Documento generado el ${new Date().toLocaleString('es-ES')}<br>
    INVICTUS Boxeo Academy — Reporte oficial del sistema
  </div>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
