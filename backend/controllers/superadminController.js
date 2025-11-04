const db = require('../models/db');

exports.listarMedicosPorEspecialidad = (req, res) => {
  const especialidadId = req.params.especialidadId;

  const sql = `
    SELECT u.id, u.nombre, u.apellido, u.email
    FROM usuarios u
    JOIN medico_especialidades me ON u.id = me.medico_id
    WHERE me.especialidad_id = ? AND u.tipo = 'medico'
  `;

  db.query(sql, [especialidadId], (err, resultados) => {
    if (err) {
      console.error("Error al listar médicos:", err);
      return res.status(500).json({ mensaje: 'Error al listar médicos.' });
    }
    res.status(200).json(resultados);
  });
};


exports.contarPacientesAtendidos = (req, res) => {
  const medicoId = req.params.medicoId;
  const { desde, hasta } = req.query;

  let sql = `
    SELECT COUNT(*) AS cantidad
    FROM turnos
    WHERE medico_id = ? AND estado = 'atendido'
  `;
  const params = [medicoId];

  if (desde && hasta) {
    sql += ' AND fecha BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  db.query(sql, params, (err, resultados) => {
    if (err) {
      console.error("Error al contar pacientes:", err);
      return res.status(500).json({ mensaje: 'Error al contar pacientes.' });
    }
    res.status(200).json(resultados[0]);
  });
};


exports.registrarMedico = (req, res) => {
  const { nombre, apellido, email, contrasena, especialidades, horarios } = req.body;

  if (!nombre || !apellido || !email || !contrasena) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  const sqlUsuario = `
    INSERT INTO usuarios (nombre, apellido, email, contrasena, tipo)
    VALUES (?, ?, ?, ?, 'medico')
  `;

  db.query(sqlUsuario, [nombre, apellido, email, contrasena], (err, resultado) => {
    if (err) {
      console.error("Error al registrar médico:", err);
      return res.status(500).json({ mensaje: 'Error al registrar médico.' });
    }

    const medicoId = resultado.insertId;

    // Asignar especialidades (si existen)
    if (Array.isArray(especialidades) && especialidades.length > 0) {
      const sqlEspecialidad = `
        INSERT INTO medico_especialidades (medico_id, especialidad_id)
        VALUES ?
      `;
      const valoresEspecialidad = especialidades.map(id => [medicoId, id]);

      db.query(sqlEspecialidad, [valoresEspecialidad], (err2) => {
        if (err2) {
          console.error("Error al asignar especialidades:", err2);
          return res.status(500).json({ mensaje: 'Error al asignar especialidades.' });
        }
      });
    }

    // Registrar horarios (si existen)
    if (Array.isArray(horarios) && horarios.length > 0) {
      const sqlHorario = `
        INSERT INTO horarios_medicoes (medico_id, dia_semana, hora_inicio, hora_fin)
        VALUES ?
      `;
      const valoresHorarios = horarios.map(h => [medicoId, h.dia_semana, h.hora_inicio, h.hora_fin]);

      db.query(sqlHorario, [valoresHorarios], (err3) => {
        if (err3) {
          console.error("Error al registrar horarios:", err3);
          return res.status(500).json({ mensaje: 'Error al registrar horarios.' });
        }
      });
    }

    res.status(201).json({ mensaje: 'Médico registrado correctamente.' });
  });
};


exports.crearSecretario = (req, res) => {
  const { nombre, apellido, email, contrasena } = req.body;

  if (!nombre || !apellido || !email || !contrasena) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  const sql = `
    INSERT INTO usuarios (nombre, apellido, email, contrasena, tipo)
    VALUES (?, ?, ?, ?, 'admin')
  `;

  db.query(sql, [nombre, apellido, email, contrasena], (err) => {
    if (err) {
      console.error("Error al registrar secretario:", err);
      return res.status(500).json({ mensaje: 'Error al registrar secretario.' });
    }
    res.status(201).json({ mensaje: 'Secretario creado correctamente.' });
  });
};


exports.obtenerFormularios = (req, res) => {
  const { nombre_completo, medico_email } = req.query;

  let sql = `
    SELECT 
      f.id, f.nombre_completo, f.contenido, f.fecha,
      u.nombre AS medico_nombre, u.apellido AS medico_apellido, u.email AS medico_email
    FROM formularios_medicos f
    LEFT JOIN usuarios u ON f.medico_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (nombre_completo) {
    sql += ' AND f.nombre_completo LIKE ?';
    params.push(`%${nombre_completo}%`);
  }

  if (medico_email) {
    sql += ' AND u.email LIKE ?';
    params.push(`%${medico_email}%`);
  }

  sql += ' ORDER BY f.fecha DESC';

  db.query(sql, params, (err, resultados) => {
    if (err) {
      console.error("Error al obtener formularios:", err);
      return res.status(500).json({ mensaje: 'Error al obtener formularios.' });
    }
    res.status(200).json(resultados);
  });
};
