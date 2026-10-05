const pool = require('../config/database');

async function main() {
  const fixPagos = await pool.query(
    `UPDATE pagos
     SET fecha_vencimiento = make_date(anio, mes, 1) - 1,
         updated_at = NOW()
     WHERE estado = 'vencido'
       AND fecha_vencimiento IS DISTINCT FROM (make_date(anio, mes, 1) - 1)
     RETURNING id_pago, membresia_id, mes, anio, fecha_vencimiento`
  );
  console.log('Vencidos con fecha incoherente ajustados al cierre del mes anterior:', fixPagos.rowCount);

  // El alumno del pago se deriva por membresias (3FN: pagos no guarda alumno_id).
  await pool.query(
    `UPDATE alumnos al
     SET fecha_vencimiento = make_date(p.anio, p.mes, 1) - 1,
         updated_at = NOW()
     FROM pagos p
     JOIN membresias m ON m.id_membresia = p.membresia_id
     WHERE m.alumno_id = al.id_alumno
       AND p.estado = 'vencido'
       AND al.fecha_vencimiento IS DISTINCT FROM (make_date(p.anio, p.mes, 1) - 1)`
  );
  console.log('Perfiles de vencidos sincronizados.');

  const conflictos = await pool.query(
    `SELECT COUNT(*)::int AS conflictos
     FROM pagos p
     JOIN membresias m ON m.id_membresia = p.membresia_id
     JOIN alumnos al ON al.id_alumno = m.alumno_id
     WHERE p.mes = EXTRACT(MONTH FROM CURRENT_DATE)::int
       AND p.anio = EXTRACT(YEAR FROM CURRENT_DATE)::int
       AND p.estado <> al.estado_pago`
  );
  console.log('Conflictos estado mes actual:', conflictos.rows[0].conflictos);

  const fechasImposibles = await pool.query(
    `SELECT COUNT(*)::int AS imposibles
     FROM alumnos
     WHERE estado_pago = 'pagado'
       AND fecha_vencimiento IS NOT NULL
       AND fecha_inscripcion IS NOT NULL
       AND fecha_vencimiento < fecha_inscripcion`
  );
  console.log('Pagados con vencimiento anterior a inscripción:', fechasImposibles.rows[0].imposibles);
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error(e);
    pool.end();
    process.exit(1);
  });
