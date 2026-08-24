import { useState, useEffect } from 'react';
import { getResumenGeneral } from '../../services/reporteService';
import { imprimirDocumento } from '../../utils/printReport';

function Reportes() {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getResumenGeneral();
        setResumen(data.resumen);
      } catch {
        setError('Error al cargar reportes');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Usuarios', value: resumen?.total_usuarios || 0, color: 'text-gray-800' },
    { label: 'Alumnos', value: resumen?.total_alumnos || 0, color: 'text-blue-600' },
    { label: 'Alumnos Pagados', value: resumen?.alumnos_pagados || 0, color: 'text-green-600' },
    { label: 'Entrenadores', value: resumen?.total_entrenadores || 0, color: 'text-purple-600' },
    { label: 'Administradores', value: resumen?.total_administradores || 0, color: 'text-amber-600' },
  ];

  const asistenciaCards = [
    { label: 'Asistencias Totales', value: resumen?.asistencias_totales || 0, color: 'text-indigo-600' },
    { label: 'Presentes', value: resumen?.asistencias_presentes || 0, color: 'text-green-600' },
    { label: 'Faltas', value: resumen?.asistencias_faltas || 0, color: 'text-red-600' },
  ];

  const horarioCards = [
    { label: 'Horarios Totales', value: resumen?.horarios_totales || 0, color: 'text-teal-600' },
    { label: 'Horarios Activos', value: resumen?.horarios_activos || 0, color: 'text-green-600' },
  ];

  const handleImprimir = () => {
    imprimirDocumento({
      titulo: 'Resumen General del Sistema',
      periodo: `Fecha de corte: ${new Date().toLocaleDateString('es-ES')}`,
      resumen: [
        { etiqueta: 'Total Usuarios', valor: resumen?.total_usuarios ?? 0 },
        { etiqueta: 'Alumnos', valor: resumen?.total_alumnos ?? 0, color: '#1d4ed8' },
        { etiqueta: 'Pagados', valor: resumen?.alumnos_pagados ?? 0, color: '#15803d' },
      ],
      secciones: [
        {
          titulo: 'Usuarios por rol',
          columnas: ['Rol', 'Cantidad'],
          filas: [
            ['Alumnos', resumen?.total_alumnos ?? 0],
            ['Entrenadores', resumen?.total_entrenadores ?? 0],
            ['Administradores', resumen?.total_administradores ?? 0],
            ['Total general', resumen?.total_usuarios ?? 0],
          ],
        },
        {
          titulo: 'Asistencias',
          columnas: ['Concepto', 'Cantidad'],
          filas: [
            ['Asistencias totales', resumen?.asistencias_totales ?? 0],
            ['Presentes', resumen?.asistencias_presentes ?? 0],
            ['Faltas', resumen?.asistencias_faltas ?? 0],
            ['Alumnos pagados (habilitados)', resumen?.alumnos_pagados ?? 0],
          ],
        },
        {
          titulo: 'Horarios',
          columnas: ['Concepto', 'Cantidad'],
          filas: [
            ['Horarios totales', resumen?.horarios_totales ?? 0],
            ['Horarios activos', resumen?.horarios_activos ?? 0],
          ],
        },
      ],
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reportes</h2>
          <p className="text-gray-500 mt-1">Resumen general del sistema</p>
        </div>
        <button onClick={handleImprimir} className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Imprimir Reporte
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <h3 className="text-lg font-semibold text-gray-700 mb-3">Usuarios</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500 font-medium">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-3">Asistencias</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {asistenciaCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500 font-medium">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-3">Horarios</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {horarioCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500 font-medium">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reportes;
