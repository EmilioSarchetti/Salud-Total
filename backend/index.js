const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

//Inicializacion del backend
const app = express();
const server = http.createServer(app);

// Configuracion del CORS y middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

//configuracion del socket.io
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] },
});

//eventos desde el back
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  // Registrar usuario
  socket.on("registrarUsuario", (userId, tipo) => {
    if (!userId) return;

    // Cada usuario tiene su propia sala
    socket.join(`user_${userId}`);
    console.log(`➡ ${tipo} ${userId} unido a sala user_${userId}`);

    // Los administradores también escuchan la sala global
    if (tipo === "admin") {
      socket.join("admins");
      console.log(`Admin ${userId} unido a sala global "admins"`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});


// Pasamos io al módulo de chat
const chatRoutesFactory = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutesFactory(io));

// Otras rutas REST
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pacientes", require("./routes/pacienteRoutes"));
app.use("/api/medicoes", require("./routes/medicoRoutes"));
app.use("/api/turno", require("./routes/turnoRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/superadmin", require("./routes/superadminRoutes"));

//inicia el servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`)
);

// Exportamos io si se necesita en otros módulos
module.exports = { io };
