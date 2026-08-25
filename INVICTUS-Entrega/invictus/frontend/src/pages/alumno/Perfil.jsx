import { useState, useEffect } from 'react';
import { getMiPerfil } from '../../services/alumnoService';

function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMiPerfil();
        setPerfil(data.perfil);
      } catch {
        setError('Error al cargar perfil');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getPagoBadge = (estado) => {
    const styles = {
      pagado: 'bg-green-100 text-green-800',
      pendiente: 'bg-amber-100 text-amber-800',
      vencido: 'bg-red-100 text-red-800',
    };
    const label = estado === 'pagado' ? 'Pagado' : estado === 'vencido' ? 'Vencido' : 'Pendiente';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-[#172033]'}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
      </div>
    );
  }

  const fields = [
    { label: 'Nombre', value: perfil?.nombre },
    { label: 'Correo', value: perfil?.correo },
    { label: 'Fecha de Inscripción', value: formatDate(perfil?.fecha_inscripcion) },
    { label: 'Estado de Pago', value: perfil ? getPagoBadge(perfil.estado_pago) : '—' },
    { label: 'Fecha de Vencimiento', value: formatDate(perfil?.fecha_vencimiento) },
    { label: 'Miembro desde', value: formatDate(perfil?.fecha_creacion) },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#172033]">Mi Perfil</h2>
        <p className="text-slate-500 mt-1">Información personal del deportista</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow-card border border-gray-200/70 transition-all duration-200 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((f) => (
              <div key={f.label}>
                <p className="text-sm text-slate-500 font-medium">{f.label}</p>
                <p className="text-sm text-[#172033] mt-1">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
