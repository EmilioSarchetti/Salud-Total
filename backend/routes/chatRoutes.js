const express = require("express");
const chatController = require("../controllers/chatController");

module.exports = (io) => {
  const router = express.Router();
  const { enviarMensaje, obtenerConversacion, obtenerChatsUsuario, asignarAdmin } = chatControllerFactory(io);

  // 📨 Enviar mensaje (paciente o admin)
  router.post("/enviar", enviarMensaje);

  // 💬 Obtener mensajes de una conversación específica
  router.get("/mensajes/:conversacion_id", obtenerConversacion);

  // 👥 Listar conversaciones del usuario (paciente o admin)
  router.get("/usuario/:usuario_id", obtenerChatsUsuario);

  // 👑 Asignar manualmente un admin a una conversación
  router.put("/asignar-admin", asignarAdmin);

  return router;
};
