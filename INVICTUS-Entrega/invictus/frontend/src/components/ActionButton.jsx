const base = 'p-1.5 rounded-lg transition-colors';

const ESTILOS = {
  ver: {
    clases: `${base} text-blue-600 bg-blue-50 hover:bg-blue-100`,
    titulo: 'Ver detalles',
    path: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  },
  editar: {
    clases: `${base} text-invictus-700 bg-invictus-50 hover:bg-invictus-100`,
    titulo: 'Editar',
    path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  pagado: {
    clases: `${base} text-green-700 bg-green-50 hover:bg-green-100`,
    titulo: 'Marcar como pagado',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  historial: {
    clases: `${base} text-indigo-600 bg-indigo-50 hover:bg-indigo-100`,
    titulo: 'Ver historial',
    path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  imprimir: {
    clases: `${base} text-slate-500 bg-gray-100 hover:bg-gray-200`,
    titulo: 'Imprimir',
    path: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z',
  },
  eliminar: {
    clases: `${base} text-red-600 bg-red-50 hover:bg-red-100`,
    titulo: 'Eliminar',
    path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  },
  estado: {
    clases: `${base} text-amber-600 bg-amber-50 hover:bg-amber-100`,
    titulo: 'Activar / Desactivar',
    path: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
};

function ActionButton({ tipo, onClick, titulo }) {
  const cfg = ESTILOS[tipo];
  if (!cfg) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo || cfg.titulo}
      aria-label={titulo || cfg.titulo}
      className={cfg.clases}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.path} />
      </svg>
    </button>
  );
}

export default ActionButton;
