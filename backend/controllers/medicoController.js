const db = require('../models/db');

//Ver turnos asignados al medico
exports.verTurnos = (req, res) => {
  const medicoId = req.params.medicoId;

  const sql = `
    SELECT 
      t.id, t.fecha, t.hora, t.estado, t.detalles,
      u.nombre AS paciente_nombre, u.apellido AS paciente_apellido, u.obra_social
    FROM turnos t
    JOIN usuarios u ON t.paciente_id = u.id
    WHERE t.medico_id = ?
    ORDER BY t.fecha, t.hora
  `;

  db.query(sql, [medicoId], (err, resultados) => {
    if (err) {
      console.error(' Error al obtener turnos:', err);
      return res.status(500).json({ mensaje: 'Error al obtener turnos.' });
    }
    res.status(200).json(resultados);
  });
};

//2. Actualizar estado de un turno
exports.actualizarEstadoTurno = (req, res) => {
  const turnoId = req.params.turnoId;
  const { estado } = req.body;

  const estadosPermitidos = ['en espera', 'confirmado', 'cancelado', 'atendido'];
  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({ mensaje: 'Estado inválido.' });
  }

  const sql = `UPDATE turnos SET estado = ? WHERE id = ?`;
  db.query(sql, [estado, turnoId], (err) => {
    if (err) {
      console.error(' Error al actualizar estado del turno:', err);
      return res.status(500).json({ mensaje: 'Error al actualizar el estado del turno.' });
    }
    res.status(200).json({ mensaje: ' Estado del turno actualizado correctamente.' });
  });
};

// 3. Obtener horarios del medico
exports.obtenerHorariosmedico = (req, res) => {
  const medicoId = req.params.medicoId;

  const sql = `
    SELECT dia_semana, hora_inicio, hora_fin
    FROM horarios_medicoes
    WHERE medico_id = ?
  `;

  db.query(sql, [medicoId], (err, resultados) => {
    if (err) {
      console.error(' Error al obtener horarios:', err);
      return res.status(500).json({ mensaje: 'Error al obtener los horarios.' });
    }
    res.status(200).json(resultados);
  });
};

// 4. Actualizar horarios del medico
exports.actualizarHorariosmedico = (req, res) => {
  const medicoId = req.params.medicoId;
  const nuevosHorarios = req.body.horarios;

  const eliminarSQL = `DELETE FROM horarios_medicoes WHERE medico_id = ?`;

  db.query(eliminarSQL, [medicoId], (err) => {
    if (err) {
      console.error(' Error al eliminar horarios anteriores:', err);
      return res.status(500).json({ mensaje: 'Error al actualizar los horarios.' });
    }

    if (!nuevosHorarios || nuevosHorarios.length === 0) {
      return res.status(200).json({ mensaje: 'Horarios eliminados correctamente.' });
    }

    const insertarSQL = `
      INSERT INTO horarios_medicoes (medico_id, dia_semana, hora_inicio, hora_fin)
      VALUES ?
    `;
    const valores = nuevosHorarios.map(h => [medicoId, h.dia_semana, h.hora_inicio, h.hora_fin]);

    db.query(insertarSQL, [valores], (err2) => {
      if (err2) {
        console.error(' Error al insertar horarios:', err2);
        return res.status(500).json({ mensaje: 'Error al insertar los horarios.' });
      }
      res.status(200).json({ mensaje: ' Horarios actualizados correctamente.' });
    });
  });
};

// 5. Ver horas ocupadas de un día
exports.horasOcupadas = (req, res) => {
  const { medicoId, fecha } = req.params;

  const sql = `
    SELECT TIME_FORMAT(hora, '%H:%i') AS hora
    FROM turnos
    WHERE medico_id = ? AND fecha = ? AND estado IN ('en espera', 'confirmado')
  `;

  db.query(sql, [medicoId, fecha], (err, resultados) => {
    if (err) {
      console.error('Error al obtener horas ocupadas:', err);
      return res.status(500).json({ mensaje: 'Error al obtener turnos ocupados' });
    }

    const horas = resultados.map(r => r.hora);
    res.json(horas);
  });
};

//6. Cambiar contraseña
exports.cambiarPassword = (req, res) => {
  const medicoId = req.params.medicoId;
  const { nueva_contrasena } = req.body;

  if (!nueva_contrasena) {
    return res.status(400).json({ mensaje: 'Debes ingresar una nueva contraseña.' });
  }

  const sql = `UPDATE usuarios SET contrasena = ? WHERE id = ? AND tipo = 'medico'`;

  db.query(sql, [nueva_contrasena, medicoId], (err) => {
    if (err) {
      console.error(' Error al cambiar contraseña:', err);
      return res.status(500).json({ mensaje: 'Error al cambiar la contraseña.' });
    }
    res.status(200).json({ mensaje: ' Contraseña actualizada correctamente.' });
  });
};

// 7. Buscar paciente por nombre completo
exports.buscarPacientePorNombreCompleto = (req, res) => {
  const { nombre, apellido } = req.query;

  if (!nombre || !apellido) {
    return res.status(400).json({ mensaje: 'Nombre y apellido requeridos.' });
  }

  const sql = `
    SELECT id, nombre, apellido, email, obra_social
    FROM usuarios
    WHERE tipo = 'paciente' AND nombre = ? AND apellido = ?
  `;

  db.query(sql, [nombre, apellido], (err, resultados) => {
    if (err) {
      console.error('Error al buscar paciente:', err);
      return res.status(500).json({ mensaje: 'Error al buscar paciente.' });
    }

    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado.' });
    }

    res.status(200).json(resultados[0]);
  });
};

// 8. Crear formulario médico
exports.crearFormularioMedico = (req, res) => {
  const { medico_id, nombre_completo, contenido } = req.body;

  if (!medico_id || !nombre_completo || !contenido) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  const insertarSQL = `
    INSERT INTO formularios_medicos (medico_id, nombre_completo, contenido)
    VALUES (?, ?, ?)
  `;

  db.query(insertarSQL, [medico_id, nombre_completo.trim(), contenido], (err) => {
    if (err) {
      console.error(' Error al guardar formulario médico:', err);
      return res.status(500).json({ mensaje: 'Error al guardar el formulario.' });
    }
    res.status(201).json({ mensaje: '✅ Formulario guardado exitosamente.' });
  });
};

// 9. Editar formulario médico
exports.editarFormularioMedico = (req, res) => {
  const formularioId = req.params.id;
  const { contenido } = req.body;

  if (!contenido) {
    return res.status(400).json({ mensaje: 'El contenido no puede estar vacío.' });
  }

  const sql = `UPDATE formularios_medicos SET contenido = ? WHERE id = ?`;

  db.query(sql, [contenido, formularioId], (err, resultado) => {
    if (err) {
      console.error(' Error al editar formulario:', err);
      return res.status(500).json({ mensaje: 'Error al actualizar el formulario.' });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Formulario no encontrado.' });
    }

    res.status(200).json({ mensaje: ' Formulario actualizado correctamente.' });
  });
};

//10. Listar formularios creados por el medico
exports.listarFormulariosDelmedico = (req, res) => {
  const medicoId = req.params.id;

  const sql = `
    SELECT * FROM formularios_medicos
    WHERE medico_id = ?
    ORDER BY fecha DESC
  `;

  db.query(sql, [medicoId], (err, resultados) => {
    if (err) {
      console.error(' Error al obtener formularios del medico:', err);
      return res.status(500).json({ mensaje: 'Error al obtener formularios.' });
    }
    res.status(200).json(resultados);
  });
};

// 11. Buscar formularios por nombre del paciente
exports.buscarFormularioPorNombre = (req, res) => {
  const { nombre } = req.params;

  const sql = `
    SELECT * FROM formularios_medicos 
    WHERE nombre_completo LIKE ? 
    ORDER BY fecha DESC;
  `;

  db.query(sql, [`%${nombre}%`], (err, results) => {
    if (err) {
      console.error("Error al buscar formularios por nombre:", err);
      return res.status(500).json({ mensaje: "Error al buscar formularios" });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensaje: "No se encontraron formularios" });
    }

    res.status(200).json(results);
  });
};