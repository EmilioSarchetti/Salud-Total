const db = require("../models/db");
const { rtdb } = require("../middleware/firebase");

module.exports = (io) => {

  //Metodo para enviar mensaje
  const enviarMensaje = (req, res) => {
    const { emisor_id, receptor_id, mensaje, emisor_tipo, receptor_tipo } = req.body;

    if (!emisor_id || !mensaje || !emisor_tipo) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios." });
    }

    // Solo permitimos el chat entre admin y paciente
    if (!["paciente", "admin"].includes(emisor_tipo) || 
        (receptor_tipo && !["paciente", "admin"].includes(receptor_tipo))) {
      return res.status(403).json({ mensaje: "Comunicación no permitida." });
    }

    if (emisor_tipo === "paciente") {
      crearOUsarConversacion(emisor_id, mensaje, res, io);
    } else if (emisor_tipo === "admin" && receptor_id) {
      responderAdmin(emisor_id, receptor_id, mensaje, res, io);
    } else {
      return res.status(400).json({ mensaje: "Datos inválidos para mensaje." });
    }
  };

  //Crear o usar conversación existente (PACIENTE)
  function crearOUsarConversacion(paciente_id, mensaje, res, io) {
    const sqlBuscar = `
      SELECT id, admin_id 
      FROM conversaciones 
      WHERE paciente_id = ? AND estado = 'abierta'
      ORDER BY fecha_inicio DESC LIMIT 1;
    `;

    db.query(sqlBuscar, [paciente_id], (err, results) => {
      if (err) {
        console.error("Error al buscar conversación:", err);
        return res.status(500).json({ mensaje: "Error interno del servidor." });
      }

      if (results.length > 0) {
        const { id: conversacion_id, admin_id } = results[0];
        guardarMensaje(conversacion_id, paciente_id, admin_id, "paciente", "admin", mensaje, io, res);
      } else {
        const sqlCrear = `
          INSERT INTO conversaciones (paciente_id, estado, fecha_inicio)
          VALUES (?, 'abierta', NOW());
        `;
        db.query(sqlCrear, [paciente_id], (err2, result) => {
          if (err2) {
            console.error("Error al crear conversación:", err2);
            return res.status(500).json({ mensaje: "Error al iniciar conversación." });
          }

          const conversacion_id = result.insertId;
          guardarMensaje(conversacion_id, paciente_id, null, "paciente", "admin", mensaje, io, res);
        });
      }
    });
  }

  //Responder mensaje (ADMIN) al usuario
  function responderAdmin(admin_id, paciente_id, mensaje, res, io) {
    const sqlBuscar = `
      SELECT id, admin_id 
      FROM conversaciones
      WHERE paciente_id = ? AND estado = 'abierta'
      ORDER BY fecha_inicio DESC LIMIT 1;
    `;

    db.query(sqlBuscar, [paciente_id], (err, results) => {
      if (err) {
        console.error("Error al buscar conversación:", err);
        return res.status(500).json({ mensaje: "Error interno." });
      }

      if (results.length === 0) {
        return res.status(404).json({ mensaje: "No existe conversación activa con este paciente." });
      }

      const { id: conversacion_id, admin_id: existenteAdmin } = results[0];
      const adminAsignado = existenteAdmin || admin_id;

      //El null del mensaje es porque el paciente_id ya se tiene
      if (!existenteAdmin) {
        const sqlAsignar = `UPDATE conversaciones SET admin_id = ? WHERE id = ?`;
        db.query(sqlAsignar, [adminAsignado, conversacion_id], (err2) => {
          if (err2) console.error("Error al asignar admin:", err2);
        });
      }

      guardarMensaje(conversacion_id, admin_id, paciente_id, "admin", "paciente", mensaje, io, res);
    });
  }

  //Notificacion y guardado del mensaje
function guardarMensaje(conversacion_id, emisor_id, receptor_id, emisor_tipo, receptor_tipo, mensaje, io, res) {
    const sqlInsert = `
      INSERT INTO mensajes_chat (conversacion_id, emisor_id, receptor_id, emisor_tipo, receptor_tipo, mensaje)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    db.query(sqlInsert, [conversacion_id, emisor_id, receptor_id, emisor_tipo, receptor_tipo, mensaje], (err, result) => {
      if (err) {
        console.error("Error al guardar mensaje:", err);
        return res.status(500).json({ mensaje: "Error al guardar mensaje." });
      }

      const nuevoMensaje = {
        id: result.insertId,
        conversacion_id,
        emisor_id,
        receptor_id,
        emisor_tipo,
        receptor_tipo,
        mensaje,
        fecha_envio: new Date().toISOString(),
      };

      //Socket.io
      if (emisor_tipo === "paciente" && !receptor_id) {
        io.to("admins").emit("nuevoMensajePendiente", nuevoMensaje);
        console.log(`Mensaje de paciente ${emisor_id} emitido a todos los admins.`);
      } else if (receptor_id) {
        io.to(`user_${receptor_id}`).emit("nuevoMensaje", nuevoMensaje);
        console.log(`Mensaje directo a user_${receptor_id}`);
      }

      io.to(`user_${emisor_id}`).emit("nuevoMensaje", nuevoMensaje);

      //Espejo en Firebase RTDB
      if (rtdb) {
        const convPath = `chats/${conversacion_id}`;
        const mensajeRef = rtdb.ref(`${convPath}/mensajes`).push();
        const payload = {
          id_mysql: nuevoMensaje.id,
          ...nuevoMensaje,
          timestamp: Date.now(),
        };

        mensajeRef
          .set(payload)
          .then(() => console.log(`RTDB: Mensaje ${nuevoMensaje.id} registrado en ${convPath}`))
          .catch((errFB) => console.warn("RTDB error:", errFB.message));

        rtdb
          .ref(`${convPath}/meta`)
          .update({
            ultima: mensaje,
            ts: payload.timestamp,
            ultimo_emisor_id: emisor_id,
            ultimo_tipo: emisor_tipo,
          })
          .catch(() => {});
      }

      res.json(nuevoMensaje);
    });
  }

  //Obtener conversación completa
  const obtenerConversacion = (req, res) => {
    const { conversacion_id } = req.params;

    const sql = `
      SELECT 
        m.*, ue.nombre AS emisor_nombre, ur.nombre AS receptor_nombre
      FROM mensajes_chat m
      LEFT JOIN usuarios ue ON ue.id = m.emisor_id
      LEFT JOIN usuarios ur ON ur.id = m.receptor_id
      WHERE m.conversacion_id = ?
      ORDER BY m.fecha_envio ASC;
    `;

    db.query(sql, [conversacion_id], (err, results) => {
      if (err) {
        console.error("Error al obtener conversación:", err);
        return res.status(500).json({ mensaje: "Error al obtener conversación." });
      }
      res.json(results);
    });
  };

  //Registro o historial de chats de un usuario
  const obtenerChatsUsuario = (req, res) => {
    const { usuario_id } = req.params;

    const sql = `
      SELECT 
        c.id AS conversacion_id,
        c.paciente_id,
        c.admin_id,
        c.estado,
        u1.nombre AS paciente_nombre,
        u2.nombre AS admin_nombre,
        (SELECT mensaje FROM mensajes_chat WHERE conversacion_id = c.id ORDER BY fecha_envio DESC LIMIT 1) AS ultimo_mensaje,
        (SELECT fecha_envio FROM mensajes_chat WHERE conversacion_id = c.id ORDER BY fecha_envio DESC LIMIT 1) AS ultima_fecha
      FROM conversaciones c
      LEFT JOIN usuarios u1 ON c.paciente_id = u1.id
      LEFT JOIN usuarios u2 ON c.admin_id = u2.id
      WHERE c.paciente_id = ? OR c.admin_id = ? OR c.admin_id IS NULL
      ORDER BY ultima_fecha DESC;
    `;

    db.query(sql, [usuario_id, usuario_id], (err, results) => {
      if (err) {
        console.error("Error al obtener chats:", err);
        return res.status(500).json({ mensaje: "Error al listar chats." });
      }
      res.json(results);
    });
  };

//Asigna un admin a una conversación de usuario
  const asignarAdmin = (req, res) => {
    const { conversacion_id, admin_id } = req.body;
    if (!conversacion_id || !admin_id)
      return res.status(400).json({ mensaje: "Faltan datos." });

    const sql = `UPDATE conversaciones SET admin_id = ? WHERE id = ?`;
    db.query(sql, [admin_id, conversacion_id], (err) => {
      if (err) {
        console.error("Error al asignar admin:", err);
        return res.status(500).json({ mensaje: "Error al asignar admin." });
      }
      res.json({ mensaje: "Admin asignado correctamente." });
    });
  };

  return { enviarMensaje, obtenerConversacion, obtenerChatsUsuario, asignarAdmin };
};
