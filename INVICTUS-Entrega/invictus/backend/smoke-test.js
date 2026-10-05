const BASE = 'http://localhost:4010';
let token = '';
let pass = 0, fail = 0;

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function check(name, res, expect = 200) {
  const ok = res.status === expect;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${name} -> HTTP ${res.status}${ok ? '' : ` (esperado ${expect})`}`);
  if (!ok) console.log('       ' + JSON.stringify(res.data).slice(0, 300));
  return res.data;
}

(async () => {
  console.log('=== AUTENTICACION ===');
  const login = await req('POST', '/api/auth/login', { correo: 'superadmin@invictus.com', password: 'hola123' });
  check('POST /api/auth/login', login);
  token = login.data?.token;
  if (!token) { console.log('Sin token, abortando.'); process.exit(1); }

  console.log('\n=== PAGOS (3FN: alumno_id eliminado) ===');
  check('GET  /api/pagos', await req('GET', `/api/pagos?mes=${new Date().getMonth() + 1}&anio=${new Date().getFullYear()}`));
  check('GET  /api/pagos/resumen', await req('GET', `/api/pagos/resumen?mes=${new Date().getMonth() + 1}&anio=${new Date().getFullYear()}`));
  check('GET  /api/pagos/alumno/1/historial', await req('GET', '/api/pagos/alumno/1/historial'));

  console.log('\n=== BUG 1.1 verificado: PATCH /api/pagos/:id (antes 500 por u.rol) ===');
  check('PATCH /api/pagos/1', await req('PATCH', '/api/pagos/1', { estado: 'pagado', monto: 250, metodo_pago: 'qr' }));
  check('PATCH /api/pagos/1 (revertir)', await req('PATCH', '/api/pagos/1', { monto: 200 }));

  console.log('\n=== BITACORA (3FN: rol_id FK, contrato por nombre) ===');
  const bit = check('GET  /api/bitacora', await req('GET', '/api/bitacora'));
  if (Array.isArray(bit?.bitacora) && bit.bitacora.length) {
    const conRol = bit.bitacora.filter(r => r.rol).length;
    console.log(`       ${conRol}/${bit.bitacora.length} registros con 'rol' resuelto por nombre`);
  }
  check('GET  /api/bitacora?rol=SuperAdmin', await req('GET', '/api/bitacora?rol=SuperAdmin'));
  check('GET  /api/bitacora?rol=Alumno (filtro real)', await req('GET', '/api/bitacora?rol=Alumno'));

  console.log('\n=== HORARIOS MULTIPLES ===');
  const hor = check('GET  /api/horarios', await req('GET', '/api/horarios'));
  const lista = hor?.horarios || [];
  if (lista.length) {
    const alumnoId = 1;
    const h1 = lista.find(h => h.dia_semana === 'lunes');
    const h2 = lista.find(h => h.dia_semana === 'miercoles');
    if (h1 && h2) {
      const a = check(`POST asignar-horario (lunes, id ${h1.id_horario})`, await req('POST', `/api/alumnos/${alumnoId}/asignar-horario`, { horario_id: h1.id_horario }), 201);
      const b = check(`POST asignar-horario (miercoles, id ${h2.id_horario})`, await req('POST', `/api/alumnos/${alumnoId}/asignar-horario`, { horario_id: h2.id_horario }), 201);
      const todos = check(`GET  /api/alumnos/${alumnoId}/horarios (plural)`, await req('GET', `/api/alumnos/${alumnoId}/horarios`));
      const n = todos?.horarios?.length ?? 0;
      console.log(`       -> alumno 1 tiene ${n} horario(s) activo(s)`);
      n >= 2 ? pass++ : (fail++, console.log('       FALLA: se esperaban 2 horarios activos'));
      n >= 2 && console.log('OK    permite N horarios activos');
      check(`GET  /api/alumnos/${alumnoId}/horario-actual (contrato singular)`, await req('GET', `/api/alumnos/${alumnoId}/horario-actual`));
      check('POST asignar duplicado (mismo bloque, no debe duplicar)', await req('POST', `/api/alumnos/${alumnoId}/asignar-horario`, { horario_id: h2.id_horario }), 201);
      const tras = await req('GET', `/api/alumnos/${alumnoId}/horarios`);
      const n2 = tras?.data?.horarios?.length ?? 0;
      console.log(`       -> tras reasignar el mismo bloque: ${n2} activo(s) (no debe crecer)`);
      n2 === n ? pass++ : (fail++, console.log('       FALLA: el indice unico no impidio el duplicado'));
      n2 === n && console.log('OK    indice unico (alumno_id, horario_id) evita duplicados');
    }
  }

  console.log('\n=== RESTO DE MODULOS (sin regresiones) ===');
  check('GET  /api/dashboard/stats', await req('GET', '/api/dashboard/stats'));
  check('GET  /api/reportes/general', await req('GET', '/api/reportes/general'));
  check('GET  /api/reportes/pagos', await req('GET', '/api/reportes/pagos'));
  check('GET  /api/usuarios', await req('GET', '/api/usuarios'));
  check('GET  /api/usuarios?rol=Alumno', await req('GET', '/api/usuarios?rol=Alumno'));
  check('GET  /api/asistencias', await req('GET', '/api/asistencias'));
  check('GET  /api/progresos', await req('GET', '/api/progresos'));
  check('GET  /api/membresias', await req('GET', '/api/membresias'));
  check('GET  /api/turnos/manana/alumnos', await req('GET', '/api/turnos/manana/alumnos'));
  // Estas rutas son exclusivas del rol Entrenador: 403 con SuperAdmin es lo correcto.
  check('GET  /api/entrenador/mis-horarios (403 esperado: solo Entrenador)', await req('GET', '/api/entrenador/mis-horarios'), 403);

  console.log('\n=== ROL ENTRENADOR (valida reportes/entrenador) ===');
  token = (await req('POST', '/api/auth/login', { correo: 'entrenador1@invictus.com', password: 'hola123' })).data?.token || token;
  check('GET  /api/reportes/entrenador (rol Entrenador)', await req('GET', '/api/reportes/entrenador'));
  check('GET  /api/entrenador/mis-horarios (rol Entrenador)', await req('GET', '/api/entrenador/mis-horarios'));
  check('GET  /api/entrenador/mis-alumnos (rol Entrenador)', await req('GET', '/api/entrenador/mis-alumnos'));

  console.log(`\n================  ${pass} OK  /  ${fail} FALLAS  ================`);
  process.exit(fail > 0 ? 1 : 0);
})();
