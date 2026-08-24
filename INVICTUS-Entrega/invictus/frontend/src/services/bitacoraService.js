import api from './api';

export const getBitacora = async (filtros = {}) => {
  const params = {};
  if (filtros.usuario_id) params.usuario_id = filtros.usuario_id;
  if (filtros.rol) params.rol = filtros.rol;
  if (filtros.modulo) params.modulo = filtros.modulo;
  if (filtros.accion) params.accion = filtros.accion;
  if (filtros.busqueda) params.busqueda = filtros.busqueda;
  if (filtros.limite) params.limite = filtros.limite;
  if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
  if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;
  const { data } = await api.get('/bitacora', { params });
  return data;
};
