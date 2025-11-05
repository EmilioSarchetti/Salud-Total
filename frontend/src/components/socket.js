import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

export const socket = io(API_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

socket.on("connect", () => {
  console.log("Conectado a Socket.IO:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Desconectado del servidor de sockets");
});