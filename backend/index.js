//Dependencias principales
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { verifyJWT } = require("./middleware/jwtMiddleware");
const { admin, rtdb } = require("./middleware/firebase");
const path = require("path");


//Inicialización del servidor Express + HTTP
const app = express();
const server = http.createServer(app);


// Configuración de CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());


//Configurar Socket.IO
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] },
});

const JWT_SECRET = process.env.JWT_SECRET || "mi_clave_secreta";


// Autenticación de Sockets con JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    console.warn("Conexión rechazada: sin token");
    return next(new Error("Token requerido"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;

    console.log(`Socket autenticado: ${decoded.email} (${decoded.tipo})`);

    // Registrar conexión en Firebase
    if (rtdb) {
      const ref = rtdb.ref(`usuarios/${decoded.id}`);
      ref
        .set({
          id: decoded.id,
          email: decoded.email,
          tipo: decoded.tipo,
          conectado: true,
          socket_id: socket.id,
          ultimaConexion: Date.now(),
        })
        .then(() =>
          console.log(`RTDB: Usuario ${decoded.email} marcado como conectado`)
        )
        .catch((err) =>
          console.warn("Error al registrar conexión en RTDB:", err.message)
        );
    }

    next();
  } catch (err) {
    console.warn("Token inválido en socket:", err.message);
    next(new Error("Token inválido"));
  }
});

//Manejo de conexiones Socket.IO con el error de autenticación
io.on("connection", (socket) => {
  const { user } = socket;
  console.log(`Usuario conectado: ${user.email} (${user.tipo})`);

  //Unir a salas según tipo
  socket.join(`user_${user.id}`);
  console.log(`${user.tipo} ${user.id} unido a sala user_${user.id}`);

  if (user.tipo === "admin" || user.tipo === "superadmin") {
    socket.join("admins");
    console.log(`${user.tipo} ${user.id} unido a sala global "admins"`);
  }

  //Desconexión de usuario
  socket.on("disconnect", () => {
    console.log(`Usuario desconectado: ${user.email}`);
    if (rtdb) {
      rtdb
        .ref(`usuarios/${user.id}`)
        .update({
          conectado: false,
          ultimaConexion: Date.now(),
        })
        .catch(() => {});
    }
  });
});

//Uso de JWT en rutas API
app.use((req, res, next) => {
  const rutasPublicas = ["/", "/prueba"];
  if (req.path.startsWith("/api/auth") || rutasPublicas.includes(req.path))
    return next();
  verifyJWT(req, res, next);
});

//Rutas API
const chatRoutesFactory = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutesFactory(io));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pacientes", require("./routes/pacienteRoutes"));
app.use("/api/medicoes", require("./routes/medicoRoutes"));
app.use("/api/turno", require("./routes/turnoRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/superadmin", require("./routes/superadminRoutes"));

//Estado del servidor Firebase
process.on("SIGINT", async () => {
  if (rtdb) {
    await rtdb.ref("servidor/estado").set({
      online: false,
      hora: new Date().toISOString(),
    });
    console.log("Servidor marcado como OFFLINE en Firebase");
  }
  process.exit(0);
});

//Iniciar el servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`Backend corriendo en http://192.168.1.9:${PORT}`)
);

module.exports = { io };
