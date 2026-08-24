import { useState, useEffect } from 'react';
import { getAsistenciasEntrenador } from '../../services/reporteService';
import { imprimirDocumento } from '../../utils/printReport';

function Reportes() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hoy = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [fechaInicio, setFechaInicio] = useState(inicioMes);
  const [fechaFin, setFechaFin] = useState(hoy);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await getAsistenciasEntrenador(fechaInicio, fechaFin);
      setDatos(data.datos);
    } catch {
      setError('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);
  useEffect(() => { fetch(); }, [fechaInicio, fechaFin]);

  const cards = [
    { label: 'Total Asistencias', value: datos?.total || 0, color: 'text-blue-600' },
    { label: 'Presentes', value: datos?.presentes || 0, color: 'text-green-600' },
    { label: 'Faltas', value: datos?.faltas || 0, color: datos?.faltas > 0 ? 'text-red-600' : 'text-gray-600' },
    { label: 'Permisos', value: datos?.permisos || 0, color: 'text-amber-600' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
      </div>
    );
  }

  const handleImprimir = () => {
    imprimirDocumento({
      titulo: 'Reporte de Asistencias del Entrenador',
      periodo: `Período: ${new Date(fechaInicio + 'T12:00:00').toLocaleDateString('es-ES')} al ${new Date(fechaFin + 'T12:00:00').toLocaleDateString('es-ES')}`,
      resumen: [
        { etiqueta: 'Total', valor: datos?.total ?? 0 },
        { etiqueta: 'Presentes', valor: datos?.presentes ?? 0, color: '#15803d' },
        { etiqueta: 'Faltas', valor: datos?.faltas ?? 0, color: '#b91c1c' },
        { etiqueta: 'Permisos', valor: datos?.permisos ?? 0, color: '#b45309' },
      ],
      secciones: [
        {
          titulo: 'Detalle de asistencia',
          columnas: ['Concepto', 'Cantidad'],
          filas: [
            ['Total de asistencias registradas', datos?.total ?? 0],
            ['Presentes', datos?.presentes ?? 0],
            ['Faltas', datos?.faltas ?? 0],
            ['Permisos', datos?.permisos ?? 0],
            ['Tardanzas', datos?.tardanzas ?? 0],
            ['Justificados', datos?.justificados ?? 0],
          ],
        },
      ],
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reporte de Asistencias</h2>
          <p className="text-gray-500 mt-1">Resumen de tus asistencias registradas</p>
        </div>
        <button onClick={handleImprimir} className="bg-invictus-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-invictus-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Imprimir Reporte
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-500 mb-1">Fecha inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Fecha fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 font-medium">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {datos && datos.presentes > 0 && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          Registraste <strong>{datos.presentes}</strong> asistencia{datos.presentes !== 1 ? 's' : ''} como presente{datos.presentes !== 1 ? 's' : ''} en este período.
        </div>
      )}
    </div>
  );
}

export default Reportes;
