const Membresia = require('../models/Membresia');
const Alumno = require('../models/Alumno');

const list = async (req, res) => {
  try {
    const membresias = await Membresia.findAll();
    return res.status(200).json({ membresias });
  } catch (error) {
    console.error('[MembresiaController:list]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getByAlumno = async (req, res) => {
  try {
    const { alumnoId } = req.params;
    const membresia = await Membresia.findByAlumno(alumnoId);
    if (!membresia) {
      return res.status(404).json({ msg: 'El alumno no tiene membresía asignada' });
    }
    return res.status(200).json({ membresia });
  } catch (error) {
    console.error('[MembresiaController:getByAlumno]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const getMia = async (req, res) => {
  try {
    if (!req.usuario.alumno_id) {
      return res.status(403).json({ msg: 'Tu cuenta no tiene perfil de alumno' });
    }
    const membresia = await Membresia.findByAlumno(req.usuario.alumno_id);
    if (!membresia) {
      return res.status(404).json({ msg: 'No tienes membresía asignada' });
    }
    return res.status(200).json({ membresia });
  } catch (error) {
    console.error('[MembresiaController:getMia]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  try {
    const { alumnoId } = req.params;
    const { tipo_plan, monto, fecha_vencimiento, fecha_inicio, estado } = req.body;

    const alumno = await Alumno.findById(alumnoId);
    if (!alumno) {
      return res.status(404).json({ msg: 'Alumno no encontrado' });
    }
    const membresia = await Membresia.findByAlumno(alumnoId);
    if (!membresia) {
      return res.status(404).json({ msg: 'El alumno no tiene membresía asignada' });
    }

    if (monto !== undefined && monto !== null && monto !== '') {
      const montoNum = parseFloat(monto);
      if (isNaN(montoNum) || montoNum <= 0) {
        return res.status(400).json({ msg: 'El monto debe ser un número mayor a 0' });
      }
    }
    if (tipo_plan !== undefined && !['mensual', 'trimestral', 'semestral', 'anual'].includes(tipo_plan)) {
      return res.status(400).json({ msg: 'El tipo de plan no es válido' });
    }
    if (estado !== undefined && !['activa', 'inactiva', 'cancelada'].includes(estado)) {
      return res.status(400).json({ msg: 'El estado no es válido' });
    }

    const actualizada = await Membresia.update(membresia.id_membresia, {
      tipo_plan,
      fecha_inicio,
      fecha_vencimiento,
      monto: monto !== undefined && monto !== null && monto !== '' ? parseFloat(monto) : undefined,
      estado,
    });

    return res.status(200).json({ msg: 'Membresía actualizada correctamente', membresia: actualizada });
  } catch (error) {
    console.error('[MembresiaController:update]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

const renovar = async (req, res) => {
  try {
    const { alumnoId } = req.params;
    const alumno = await Alumno.findById(alumnoId);
    if (!alumno) {
      return res.status(404).json({ msg: 'Alumno no encontrado' });
    }
    const membresia = await Membresia.findByAlumno(alumnoId);
    if (!membresia) {
      const creada = await Membresia.crear({ alumno_id: alumnoId });
      return res.status(201).json({ msg: 'Membresía creada correctamente', membresia: creada });
    }

    let base = new Date();
    if (membresia.fecha_vencimiento) {
      const ven = new Date(membresia.fecha_vencimiento);
      if (!isNaN(ven.getTime()) && ven > base) {
        base = ven;
      }
    }
    const nuevaVen = new Date(base);
    nuevaVen.setDate(nuevaVen.getDate() + 30);

    const actualizada = await Membresia.update(membresia.id_membresia, {
      fecha_inicio: new Date().toISOString().slice(0, 10),
      fecha_vencimiento: nuevaVen.toISOString().slice(0, 10),
      estado: 'activa',
    });

    return res.status(200).json({ msg: 'Membresía renovada correctamente', membresia: actualizada });
  } catch (error) {
    console.error('[MembresiaController:renovar]', error);
    return res.status(500).json({ msg: 'Error interno del servidor' });
  }
};

module.exports = { list, getByAlumno, getMia, update, renovar };