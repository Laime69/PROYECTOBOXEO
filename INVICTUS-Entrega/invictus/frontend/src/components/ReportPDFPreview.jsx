import { useEffect, useRef, useState } from 'react';
import { construirDocumentoHTML, imprimirHTML } from '../utils/printReport';

function ReportPDFPreview({ open, onClose, doc }) {
  const iframeRef = useRef(null);
  const [altura, setAltura] = useState(1100);

  useEffect(() => {
    if (!open) return undefined;
    const manejarTecla = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', manejarTecla);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', manejarTecla);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !iframeRef.current || !doc) return;
    const iframe = iframeRef.current;
    const ajustar = () => {
      try {
        const d = iframe.contentDocument;
        if (d?.body) setAltura(Math.max(d.body.scrollHeight, 600));
      } catch {
        /* sin acceso */
      }
    };
    iframe.onload = ajustar;
    setTimeout(ajustar, 300);
  }, [open, doc]);

  if (!open || !doc) return null;

  const html = construirDocumentoHTML(doc);

  const handleImprimir = () => imprimirHTML(html);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-800/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 py-3 bg-white shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-invictus-600 text-white flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-5.414-5.414A2 2 0 0011.586 2H7a2 2 0 00-2 2v15a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#172033] truncate">Vista previa del reporte — PDF</p>
            <p className="text-xs text-slate-500 truncate">{doc.titulo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImprimir}
            className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Imprimir / Guardar PDF
          </button>
          <button
            onClick={onClose}
            className="border border-gray-300 text-slate-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-6 px-4">
        <div
          className="mx-auto bg-white shadow-2xl rounded-sm"
          style={{ maxWidth: '820px', minHeight: `${altura}px` }}
        >
          <iframe
            ref={iframeRef}
            title="Vista previa del reporte"
            srcDoc={html}
            className="w-full border-0"
            style={{ height: `${altura}px` }}
          />
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Use «Imprimir / Guardar PDF» y elija «Guardar como PDF» en el diálogo de impresión para descargar el documento.
        </p>
      </div>
    </div>
  );
}

export default ReportPDFPreview;
