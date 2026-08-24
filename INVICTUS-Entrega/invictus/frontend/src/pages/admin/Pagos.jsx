import { useState, useEffect } from 'react';
import { getPagos, marcarPagado, getResumenPagos, getHistorialAlumno } from '../../services/pagoService';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ANIOS = [2024, 2025, 2026, 2027];

const NOMBRES_TURNO = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

const formatMonto = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero.toFixed(2) : '0.00';
};

function Pagos() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [formPago, setFormPago] = useState({
    monto: '200',
    metodo_pago: 'efectivo',
    fecha_pago: hoy.toISOString().slice(0, 10),
    observacion: '',
  });

  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historialAlumnoData, setHistorialAlumnoData] = useState([]);
  const [historialNombre, setHistorialNombre] = useState('');
  const [historialLoading, setHistorialLoading] = useState(false);

  const fetchPagos = async () => {
    setLoading(true);
    try {
      const params = { mes, anio };
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroTurno) params.turno = filtroTurno;
      if (busqueda.trim()) params.busqueda = busqueda.trim();
      const data = await getPagos(params);
      setPagos(data.pagos || []);
    } catch (err) {
      const msg = err?.response?.data?.msg || 'Error al cargar pagos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumen = async () => {
    try {
      const data = await getResumenPagos({ mes, anio });
      setResumen(data.resumen);
    } catch {}
  };

  useEffect(() => {
    fetchPagos();
    fetchResumen();
  }, [mes, anio]);

  useEffect(() => {
    fetchPagos();
  }, [filtroEstado, filtroTurno]);

  useEffect(() => {
    const t = setTimeout(() => { fetchPagos(); }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const openPagoModal = (alumno) => {
    setSelectedAlumno(alumno);
    setFormPago({
      monto: '200',
      metodo_pago: 'efectivo',
      fecha_pago: new Date().toISOString().slice(0, 10),
      observacion: '',
    });
    setShowPagoModal(true);
  };

  const handleGuardarPago = async (e) => {
    e.preventDefault();
    if (!selectedAlumno) return;
    try {
      await marcarPagado({
        alumno_id: selectedAlumno.alumno_id,
        mes,
        anio,
        monto: parseFloat(formPago.monto),
        metodo_pago: formPago.metodo_pago,
        fecha_pago: formPago.fecha_pago,
        observacion: formPago.observacion || null,
      });
      setSuccess(`Pago registrado: ${selectedAlumno.alumno_nombre}`);
      setShowPagoModal(false);
      fetchPagos();
      fetchResumen();
    } catch (err) {
      const msg = err?.response?.data?.msg || 'Error al registrar pago';
      setError(msg);
    }
  };

  const openHistorial = async (alumno) => {
    setHistorialNombre(alumno.alumno_nombre);
    setShowHistorialModal(true);
    setHistorialLoading(true);
    try {
      const data = await getHistorialAlumno(alumno.alumno_id);
      setHistorialAlumnoData(data.historial || []);
    } catch {
      setHistorialAlumnoData([]);
    } finally {
      setHistorialLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      pagado: 'bg-green-100 text-green-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      vencido: 'bg-red-100 text-red-800',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100 text-gray-800'}`;
  };

  const getLabelEstado = (estado) => {
    const labels = { pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido' };
    return labels[estado] || estado;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Pagos</h2>
          <p className="text-gray-500 mt-1">Control mensual de pagos</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            {MESES.map((label, idx) => (
              <option key={idx + 1} value={idx + 1}>{label}</option>
            ))}
          </select>
          <select
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            {ANIOS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {resumen && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">Total Alumnos</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{resumen.total_alumnos}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">Pagados del Mes</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{resumen.pagados_mes}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{resumen.pendientes_mes}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">Vencidos</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{resumen.vencidos}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">${formatMonto(resumen.ingresos_mes)}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800 flex items-center gap-2">
              <span className="font-semibold">Inscritos hoy:</span>
              <span className="text-lg font-bold">{resumen.inscritos_hoy}</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800 flex items-center gap-2">
              <span className="font-semibold">Inscritos esta semana:</span>
              <span className="text-lg font-bold">{resumen.inscritos_semana}</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800 flex items-center gap-2">
              <span className="font-semibold">Inscritos este mes:</span>
              <span className="text-lg font-bold">{resumen.inscritos_mes}</span>
            </div>
          </div>
        </>
      )}

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">{success}</div>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar alumno por nombre, correo o CI..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-invictus-500"
        />
        <span className="text-sm text-gray-500 font-medium mr-1">Filtrar:</span>
        {['', 'pagado', 'pendiente', 'vencido'].map((est) => (
          <button
            key={est}
            onClick={() => setFiltroEstado(est)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filtroEstado === est
                ? 'bg-invictus-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {est ? getLabelEstado(est) : 'Todos'}
          </button>
        ))}
        <span className="text-sm text-gray-300 mx-1">|</span>
        {['', 'manana', 'tarde', 'noche'].map((tur) => (
          <button
            key={tur}
            onClick={() => setFiltroTurno(tur)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filtroTurno === tur
                ? 'bg-invictus-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tur ? NOMBRES_TURNO[tur] : 'Todos'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
          </div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay alumnos registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Turno</th>
                  <th className="px-4 py-3 font-medium text-center">Mes</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Monto</th>
                  <th className="px-4 py-3 font-medium">Inscripción</th>
                  <th className="px-4 py-3 font-medium">Fecha Pago</th>
                  <th className="px-4 py-3 font-medium">Vencimiento</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={`${p.alumno_id}_${p.mes}_${p.anio}`} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.alumno_nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.turno ? NOMBRES_TURNO[p.turno] || p.turno : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-center">{MESES[p.mes - 1]} {p.anio}</td>
                    <td className="px-4 py-3">
                      <span className={getEstadoBadge(p.estado)}>
                        {getLabelEstado(p.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-800 font-medium">
                      {p.estado === 'pagado' ? `$${formatMonto(p.monto)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(p.fecha_inscripcion)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.estado === 'pagado' ? formatDate(p.fecha_pago) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(p.fecha_vencimiento)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.metodo_pago || '—'}</td>
                    <td className="px-4 py-3 text-right text-sm space-x-2 whitespace-nowrap">
                      {p.estado === 'pagado' && (
                        <button
                          onClick={() => {
                            const w = window.open('', '_blank');
                            w.document.write(`
                              <html><head><title>Comprobante INVICTUS</title>
                              <style>body{font-family:Arial,sans-serif;max-width:400px;margin:40px auto;padding:20px;border:2px solid #333}
                              h2{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:20px}
                              .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #ccc}
                              .label{color:#666;font-size:13px}.value{font-weight:bold;font-size:14px}
                              .total{font-size:18px;text-align:right;margin-top:15px;padding-top:10px;border-top:2px solid #333}
                              .footer{text-align:center;margin-top:30px;font-size:11px;color:#999}</style></head><body>
                              <h2>🥊 INVICTUS BOXEO</h2>
                              <p style="text-align:center;color:#666;font-size:12px">COMPROBANTE DE PAGO</p>
                              <div class="row"><span class="label">Alumno:</span><span class="value">${p.alumno_nombre || ''}</span></div>
                              <div class="row"><span class="label">Mes:</span><span class="value">${MESES[p.mes - 1]} ${p.anio}</span></div>
                              <div class="row"><span class="label">Estado:</span><span class="value">Pagado</span></div>
                              <div class="row"><span class="label">Monto:</span><span class="value">$${formatMonto(p.monto)}</span></div>
                              <div class="row"><span class="label">Método:</span><span class="value">${p.metodo_pago || '—'}</span></div>
                              <div class="row"><span class="label">Fecha pago:</span><span class="value">${formatDate(p.fecha_pago)}</span></div>
                              <div class="row"><span class="label">Vencimiento:</span><span class="value">${formatDate(p.fecha_vencimiento)}</span></div>
                              <div class="total"><strong>TOTAL: $${formatMonto(p.monto)}</strong></div>
                              <div class="footer">Invictus Boxeo Academy<br>${new Date().toLocaleDateString('es-ES')}</div>
                              </body></html>`);
                            w.document.close();
                            w.print();
                          }}
                          className="text-gray-600 hover:text-gray-800 font-medium"
                          title="Imprimir comprobante"
                        >
                          Imprimir
                        </button>
                      )}
                      {p.estado !== 'pagado' && (
                        <button
                          onClick={() => openPagoModal(p)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Marcar Pagado
                        </button>
                      )}
                      <button
                        onClick={() => openHistorial(p)}
                        className="text-invictus-600 hover:text-invictus-800 font-medium"
                      >
                        Historial
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPagoModal && selectedAlumno && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Registrar Pago</h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-800">{selectedAlumno.alumno_nombre}</p>
              <p className="text-xs text-gray-500">{MESES[mes - 1]} {anio}</p>
            </div>
            <form onSubmit={handleGuardarPago} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPago.monto}
                  onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Método de pago</label>
                <select
                  value={formPago.metodo_pago}
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de pago</label>
                <input
                  type="date"
                  value={formPago.fecha_pago}
                  onChange={(e) => setFormPago({ ...formPago, fecha_pago: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Observación (opcional)</label>
                <textarea
                  value={formPago.observacion}
                  onChange={(e) => setFormPago({ ...formPago, observacion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows="2"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPagoModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistorialModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Historial de Pagos</h3>
                <p className="text-sm text-gray-500">{historialNombre}</p>
              </div>
              <button onClick={() => setShowHistorialModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            {historialLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-invictus-200 border-t-invictus-600 rounded-full animate-spin" />
              </div>
            ) : historialAlumnoData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay historial de pagos</div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="px-3 py-2 font-medium">Mes</th>
                      <th className="px-3 py-2 font-medium">Monto</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                      <th className="px-3 py-2 font-medium">Fecha Pago</th>
                      <th className="px-3 py-2 font-medium">Método</th>
                      <th className="px-3 py-2 font-medium">Registrado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialAlumnoData.map((h, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800">{MESES[h.mes - 1]} {h.anio}</td>
                        <td className="px-3 py-2 text-gray-600">{h.monto ? `$${formatMonto(h.monto)}` : '—'}</td>
                        <td className="px-3 py-2">
                          <span className={getEstadoBadge(h.estado)}>{getLabelEstado(h.estado)}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{h.fecha_pago ? formatDate(h.fecha_pago) : '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{h.metodo_pago || '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{h.registrado_por_nombre || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowHistorialModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pagos;
