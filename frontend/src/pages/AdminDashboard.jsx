import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Chat from "../components/chat.jsx";
import { socket } from "../components/socket.js";
import "../styles.css";
import LogoutButton from "../components/LogoutButton";
import api from "../components/axios"; // cliente axios con token

function AdminDashboard() {
  const { state } = useLocation();
  const admin = state?.usuario || JSON.parse(localStorage.getItem("usuario") || "null");

  //estados generales
  const [activeTab, setActiveTab] = useState("turnos");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  //turnos
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [seleccionada, setSeleccionada] = useState("");
  const [medico, setMedico] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [detalles, setDetalles] = useState("");
  const [turnos, setTurnos] = useState([]);

  const [horariosMedico, setHorariosMedico] = useState([]);
  const [horasOcupadas, setHorasOcupadas] = useState([]);

  //formularios
  const [formularios, setFormularios] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtromedicoEmail, setFiltromedicoEmail] = useState("");

  //chat
  const [pacientesChat, setPacientesChat] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  //inicialización
  useEffect(() => {
    setEspecialidades([
      { id: 1, nombre: "Clínica" },
      { id: 2, nombre: "Pediatría" },
      { id: 3, nombre: "Cardiología" },
      { id: 4, nombre: "Ginecología" },
    ]);
  }, []);

  //socket.IO
  useEffect(() => {
    if (!admin?.id) return;
    socket.emit("registrarUsuario", admin.id, "admin");
    console.log(`🧩 Admin ${admin.nombre} conectado.`);
  }, [admin]);

  //turnos – funciones
  const cargarTurnos = async () => {
    try {
      const res = await api.get(`/pacientes/turnos/${admin.id}`);
      setTurnos(res.data);
    } catch (err) {
      console.error("Error al cargar turnos:", err);
    }
  };

  useEffect(() => {
    if (admin?.id) cargarTurnos();
  }, [admin]);

  const handleEspecialidad = async (e) => {
    const id = e.target.value;
    setSeleccionada(id);
    setMedico("");
    setMedicos([]);
    setFecha("");
    setHora("");
    setHorariosMedico([]);
    setHorasOcupadas([]);

    try {
      const res = await api.get(`/admin/medicos-por-especialidad/${id}`);
      setMedicos(res.data);
    } catch (err) {
      console.error("Error al cargar médicos:", err);
    }
  };

  const handleMedico = async (e) => {
    const id = e.target.value;
    setMedico(id);
    setFecha("");
    setHora("");
    setHorasOcupadas([]);

    try {
      const res = await api.get(`/medicoes/horarios/${id}`);
      setHorariosMedico(res.data);
    } catch (err) {
      console.error("Error al cargar horarios:", err);
    }
  };

  useEffect(() => {
    if (fecha && medico) {
      api
        .get(`/medicoes/ocupados/${medico}/${fecha}`)
        .then((res) => {
          const horas = Array.isArray(res.data) ? res.data : [];
          setHorasOcupadas(horas);
        })
        .catch((err) => console.error("Error al obtener horas ocupadas:", err));
    }
  }, [fecha, medico]);

  const obtenerDiaSemana = (fechaStr) => {
    if (!fechaStr) return null;
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const fechaReal = fechaStr.includes("T")
      ? new Date(fechaStr)
      : new Date(fechaStr + "T00:00:00");
    return dias[fechaReal.getDay()];
  };

  const generarBloques = (inicio, fin) => {
    const bloques = [];
    const [hInicio, mInicio] = inicio.split(":").map(Number);
    const [hFin, mFin] = fin.split(":").map(Number);
    let h = hInicio, m = mInicio;
    while (h < hFin || (h === hFin && m < mFin)) {
      const horaStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      bloques.push(horaStr);
      m += 30;
      if (m >= 60) { m -= 60; h++; }
    }
    return bloques;
  };

  const bloquesDisponibles = () => {
    if (!fecha || horariosMedico.length === 0) return [];
    const dia = obtenerDiaSemana(fecha);
    const normalizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const horariosDia = horariosMedico.filter(
      (h) => normalizar(h.dia_semana) === normalizar(dia)
    );
    let bloques = [];
    horariosDia.forEach((h) => {
      bloques = bloques.concat(generarBloques(h.hora_inicio, h.hora_fin));
    });
    return bloques.filter((b) => !horasOcupadas.includes(b));
  };

  const solicitarTurno = async () => {
    setMensaje("");
    setError("");
    if (!hora) return setError("Seleccioná una hora disponible.");
    try {
      await api.post(`/pacientes/solicitar-turno`, {
        paciente_id: admin.id,
        medico_id: medico,
        especialidad_id: seleccionada,
        fecha,
        hora,
        detalles: detalles
          ? `${detalles}\n(Solicitado por ADMIN ${admin.nombre})`
          : `(Solicitado por ADMIN ${admin.nombre})`,
      });
      setMensaje("Turno solicitado correctamente.");
      setHora("");
      setDetalles("");
      await cargarTurnos();
      setTimeout(() => setMensaje(""), 3000);
    } catch (err) {
      console.error("Error al solicitar turno:", err);
      setError("Error al solicitar turno.");
    }
  };

  const cancelarTurno = async (id) => {
    try {
      const seguro = window.confirm("¿Seguro que querés cancelar este turno?");
      if (!seguro) return;
      await api.patch(`/pacientes/turno/cancelar/${id}`);
      await cargarTurnos();
      setMensaje("Turno cancelado correctamente.");
      setTimeout(() => setMensaje(""), 3000);
    } catch (err) {
      console.error("Error al cancelar turno:", err);
      setError("Error al cancelar turno.");
    }
  };

  //formularios
  const buscarFormularios = async () => {
    try {
      const res = await api.get(`/admin/formularios`, {
        params: { nombre_completo: filtroNombre, medico_email: filtromedicoEmail },
      });
      setFormularios(res.data);
    } catch (err) {
      console.error("Error al buscar formularios:", err);
    }
  };

  //chat
  const cargarConversaciones = async () => {
    if (!admin?.id) return;
    try {
      const res = await api.get(`/chat/usuario/${admin.id}`);
      setPacientesChat(res.data);
    } catch (err) {
      console.error("Error al cargar conversaciones:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "chat") cargarConversaciones();
  }, [activeTab]);

  //RENDER
  return (
    <div className="container">
      <div>
        <LogoutButton />
      </div>

      <h2>Panel de Administración</h2>
      <h4>Bienvenido/a, {admin?.nombre}</h4>

      <div className="tab-nav">
        <button onClick={() => setActiveTab("turnos")} className={activeTab === "turnos" ? "active" : ""}>Turnos</button>
        <button onClick={() => setActiveTab("formularios")} className={activeTab === "formularios" ? "active" : ""}>Formularios</button>
        <button onClick={() => setActiveTab("chat")} className={activeTab === "chat" ? "active" : ""}>Chat</button>
      </div>

      {/* TURNOS */}
      {activeTab === "turnos" && (
        <>
          <h3>Solicitar Turno para Paciente</h3>
          <label>Especialidad:</label>
          <select value={seleccionada} onChange={handleEspecialidad}>
            <option value="">Seleccionar</option>
            {especialidades.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>

          <label>Médico:</label>
          <select value={medico} onChange={handleMedico}>
            <option value="">Seleccionar</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} {m.apellido}
              </option>
            ))}
          </select>

          <label>Fecha:</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

          <label>Hora:</label>
          <select value={hora} onChange={(e) => setHora(e.target.value)}>
            <option value="">Seleccionar</option>
            {bloquesDisponibles().map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <label>Detalles (nombre del paciente, motivo, etc):</label>
          <textarea rows="3" value={detalles} onChange={(e) => setDetalles(e.target.value)} />

          <button onClick={solicitarTurno}>Solicitar Turno</button>

          <hr />
          <h3>Turnos Solicitados</h3>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Médico</th>
                <th>Especialidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnos.map((t) => (
                <tr key={t.id}>
                  <td>{t.fecha}</td>
                  <td>{t.hora}</td>
                  <td>{t.estado}</td>
                  <td>{t.nombre_medico} {t.apellido_medico}</td>
                  <td>{t.especialidad}</td>
                  <td>
                    {["en espera", "confirmado"].includes(t.estado) && (
                      <button onClick={() => cancelarTurno(t.id)}>Cancelar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* FORMULARIOS */}
      {activeTab === "formularios" && (
        <div>
          <h3>Buscar Formularios</h3>
          <input type="text" placeholder="Nombre del paciente" value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />
          <input type="text" placeholder="Correo del médico (opcional)" value={filtromedicoEmail} onChange={(e) => setFiltromedicoEmail(e.target.value)} />
          <button onClick={buscarFormularios}>Buscar Formularios</button>

          {formularios.length > 0 && (
            <ul>
              {formularios.map((f) => (
                <li key={f.id}>
                  <strong>{f.nombre_completo}</strong> -{" "}
                  {new Date(f.fecha).toLocaleString()}
                  <pre>{f.contenido}</pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* CHAT */}
      {activeTab === "chat" && (
        <div className="chat-tab">
          <h3>Chat con Pacientes</h3>
          <div className="chat-layout">
            <div className="chat-list">
              <h4>Conversaciones</h4>
              {pacientesChat.length === 0 ? (
                <p>No hay conversaciones activas.</p>
              ) : (
                <ul>
                  {pacientesChat.map((chat) => (
                    <li
                      key={chat.conversacion_id}
                      onClick={() =>
                        setPacienteSeleccionado({
                          id: chat.paciente_id,
                          nombre: chat.paciente_nombre || "Paciente",
                          tipo: "paciente",
                          conversacion_id: chat.conversacion_id,
                        })
                      }
                      className={`chat-item ${pacienteSeleccionado?.id === chat.paciente_id ? "active" : ""}`}
                    >
                      <strong>{chat.paciente_nombre || "Paciente"}</strong>
                      <p className="chat-preview">{chat.ultimo_mensaje || "Sin mensajes"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="chat-panel">
              {pacienteSeleccionado ? (
                <Chat
                  usuario={{ id: admin.id, nombre: admin.nombre, tipo: "admin" }}
                  receptor={{
                    id: pacienteSeleccionado.id,
                    nombre: pacienteSeleccionado.nombre,
                    tipo: "paciente",
                  }}
                  conversacionId={pacienteSeleccionado.conversacion_id}
                />
              ) : (
                <p>Seleccioná un paciente para chatear.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default AdminDashboard;
