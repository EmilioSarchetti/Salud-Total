import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

//Tomamos el token almacenado después del login
const token = localStorage.getItem("token");

export const socket = io(API_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,

  //Enviar token al backend para autenticación
  auth: { token },
});

//funciones de manejo de eventos globales
socket.on("connect", () => {
  console.log("Conectado a Socket.IO:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Error de conexión con Socket.IO:", err.message);
  if (err.message.includes("Token")) {
    console.warn("Token inválido o faltante, se requiere nuevo login.");
    localStorage.removeItem("token");
  }
});

socket.on("disconnect", (reason) => {
  console.log("Desconectado del servidor de sockets:", reason);
});
