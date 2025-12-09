import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MapaClinica from "../components/MapaClinica";
import Chat from "../components/chat.jsx";
import { socket } from "../components/socket.js";
import LogoutButton from "../components/LogoutButton";
import api from "../components/axios";

function PacienteDashboard() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const paciente =
    state?.usuario || JSON.parse(localStorage.getItem("usuario") || "null");

  const [activeTab, setActiveTab] = useState("turnos");

  const [especialidades] = useState([
    { id: 1, nombre: "Clínica" },
    { id: 2, nombre: "Pediatría" },
    { id: 3, nombre: "Cardiología" },
    { id: 4, nombre: "Ginecología" },
  ]);

  const [medicos, setMedicos] = useState([]);
  const [seleccionada, setSeleccionada] = useState("");
  const [medico, setMedico] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [detalles, setDetalles] = useState("");
  const [turnos, setTurnos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [horariosMedico, setHorariosMedico] = useState([]);
  const [horariosEdicion, setHorariosEdicion] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [editarTurnoId, setEditarTurnoId] = useState(null);

  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");

  const [obraSocial, setObraSocial] = useState(paciente?.obra_social || "");
  const [nuevaPassword, setNuevaPassword] = useState("");

  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [conversacionActiva, setConversacionActiva] = useState(null);

  /*  VALIDACIÓN DE SESIÓN */
  useEffect(() => {
  if (paciente === null) return; 

  if (!paciente?.id) {
    console.warn("Sesión inválida.");
    navigate("/", { replace: true });
  }
}, [paciente]);


  /* SOCKET EVENTS */
  useEffect(() => {
  const handleDisconnect = (reason) => {
    console.log("🔴 Socket desconectado en paciente:", reason);
  };

  socket.on("disconnect", handleDisconnect);
  return () => {
    socket.off("disconnect", handleDisconnect);
  };
}, []);

  /*CARGAR TURNOS */
  const cargarTurnos = useCallback(async () => {
    try {
      const res = await api.get(`/pacientes/turnos/${paciente.id}`);
      setTurnos(res.data);
    } catch {
      setError("Error al cargar turnos.");
    }
  }, [paciente?.id]);

  useEffect(() => {
    if (paciente?.id) cargarTurnos();
  }, [paciente?.id, cargarTurnos]);

  /* MANEJO DE ESPECIALIDAD */
  const handleEspecialidad = async (e) => {
    const id = e.target.value;
    setSeleccionada(id);

    setMedicos([]);
    setMedico("");
    setFecha("");
    setHora("");
    setHorariosMedico([]);
    setHorariosOcupados([]);

    try {
      const res = await api.get(`/admin/medicos-por-especialidad/${id}`);
      setMedicos(res.data);
    } catch {
      setError("Error al cargar médicos.");
    }
  };

  /* MANEJO MÉDICO */
  const handleMedico = async (e) => {
    const id = e.target.value;
    setMedico(id);
    setFecha("");
    setHora("");
    setHorariosOcupados([]);

    try {
      const res = await api.get(`/medicos/horarios/${id}`);
      setHorariosMedico(res.data);
    } catch {
      setError("Error al cargar horarios.");
    }
  };

  /* OBTENER HORAS OCUPADAS */
  useEffect(() => {
    if (fecha && medico) {
      api
        .get(`/medicos/ocupados/${medico}/${fecha}`)
        .then((res) =>
          setHorariosOcupados(Array.isArray(res.data) ? res.data : [])
        )
        .catch(() => console.error("Error al obtener horas ocupadas"));
    }
  }, [fecha, medico]);

  /* UTILIDADES */

  const obtenerDiaSemana = (fechaStr) => {
    const dias = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const fechaReal = fechaStr.includes("T")
      ? new Date(fechaStr)
      : new Date(fechaStr + "T00:00:00");
    return dias[fechaReal.getDay()];
  };

  const generarBloques = (inicio, fin) => {
    const bloques = [];
    const [hInicio, mInicio] = inicio.split(":").map(Number);
    const [hFin, mFin] = fin.split(":").map(Number);

    let h = hInicio,
      m = mInicio;

    while (h < hFin || (h === hFin && m < mFin)) {
      bloques.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += 30;
      if (m >= 60) {
        m -= 60;
        h++;
      }
    }
    return bloques;
  };

  const bloquesDisponibles = () => {
    if (!fecha || horariosMedico.length === 0) return [];

    const dia = obtenerDiaSemana(fecha);

    const normalizar = (s) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const horariosDia = horariosMedico.filter(
      (h) => normalizar(h.dia_semana) === normalizar(dia)
    );

    let bloques = [];
    horariosDia.forEach(
      (h) => (bloques = [...bloques, ...generarBloques(h.hora_inicio, h.hora_fin)])
    );

    return bloques.filter((b) => !horariosOcupados.includes(b));
  };

  /* SOLICITAR TURNO*/
  const solicitarTurno = async () => {
    if (!paciente?.id) return setError("Sesión inválida.");
    if (!hora) return setError("Seleccioná una hora disponible.");
    if (!fecha) return setError("Seleccioná una fecha.");

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaSel = new Date(fecha + "T00:00:00");
    const soloFechaSel = new Date(fechaSel);
    soloFechaSel.setHours(0, 0, 0, 0);

    if (soloFechaSel < hoy) {
      return setError("No podés solicitar turnos en fechas anteriores a hoy.");
    }

    if (soloFechaSel.getTime() === hoy.getTime()) {
      const ahora = new Date();
      const [h, m] = hora.split(":").map(Number);

      if (h < ahora.getHours() || (h === ahora.getHours() && m <= ahora.getMinutes())) {
        return setError("Esta hora ya pasó. Elegí otro horario.");
      }
    }

    try {
  await api.post(`/pacientes/solicitar-turno`, {
    paciente_id: paciente.id,
    medico_id: medico,
    especialidad_id: seleccionada,
    fecha,
    hora,
    detalles,
  });

  setMensaje("Turno solicitado correctamente.");
  setError("");       
  setHora("");
  setDetalles("");
  await cargarTurnos();

  setTimeout(() => setMensaje(""), 3000);
} catch {
  setError("Error al solicitar turno.");
}

  };

  /*CHAT EN TIEMPO REAL*/
  useEffect(() => {
  if (!paciente?.id) return;          
  if (activeTab !== "chat") return;     

  if (paciente?.id && activeTab === "chat") {

    const cargar = () => {
      api
        .get(`/chat/usuario/${paciente.id}`)
        .then((res) => {
          const conversacion =
            res.data.find((c) => c.estado === "abierta") ||
            res.data[0] ||
            null;

          setConversacionActiva(conversacion);
        })
        .catch(() => console.error("Error al cargar la conversación."));
    };

      cargar();

      const handleNuevoMensaje = (msg) => {
        if (
          msg.receptor_id === paciente.id ||
          msg.emisor_id === paciente.id ||
          msg.conversacion_id === conversacionActiva?.conversacion_id
        ) {
          cargar();
        }
      };

      const handleNuevaConversacion = (conv) => {
        if (conv.paciente_id === paciente.id) cargar();
      };

      socket.on("nuevoMensaje", handleNuevoMensaje);
      socket.on("nuevaConversacion", handleNuevaConversacion);

      return () => {
        socket.off("nuevoMensaje", handleNuevoMensaje);
        socket.off("nuevaConversacion", handleNuevaConversacion);
      };
    }
  }, [activeTab, paciente?.id, conversacionActiva?.conversacion_id]);

    /*LIMPIAR MENSAJES AL CAMBIAR TAB*/
  useEffect(() => {
    setError("");
    setMensaje("");
  }, [activeTab]);


  /*EDICIÓN DE TURNOS*/
  const iniciarEdicion = async (turno) => {
    setEditarTurnoId(turno.id);
    setNuevaFecha(turno.fecha.split("T")[0]);
    setNuevaHora(turno.hora);

    try {
      const res = await api.get(`/medicos/horarios/${turno.medico_id}`);
      setHorariosEdicion(res.data);
    } catch {
      console.error("Error al obtener horarios.");
    }
  };

  const bloquesEdicion = () => {
    if (!nuevaFecha || horariosEdicion.length === 0) return [];

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaSel = new Date(nuevaFecha + "T00:00:00");
    const soloFechaSel = new Date(fechaSel);
    soloFechaSel.setHours(0, 0, 0, 0);

    if (soloFechaSel < hoy) return [];

    const dia = obtenerDiaSemana(nuevaFecha);

    const normalizar = (s) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const horariosDia = horariosEdicion.filter(
      (h) => normalizar(h.dia_semana) === normalizar(dia)
    );

    let bloques = [];
    horariosDia.forEach(
      (h) => (bloques = [...bloques, ...generarBloques(h.hora_inicio, h.hora_fin)])
    );

    const ahora = new Date();
    if (soloFechaSel.getTime() === hoy.getTime()) {
      const horaActual = ahora.getHours();
      const minutoActual = ahora.getMinutes();

      bloques = bloques.filter((b) => {
        const [h, m] = b.split(":").map(Number);
        return h > horaActual || (h === horaActual && m > minutoActual);
      });
    }

    return bloques.filter((b) => !horariosOcupados.includes(b));
  };

  const guardarCambiosTurno = async (id) => {
    if (!nuevaFecha || !nuevaHora)
      return setError("Debes elegir una fecha y hora válida.");

    try {
      await api.put(`/pacientes/turno/${id}`, {
        nuevaFecha,
        nuevaHora,
      });

      setEditarTurnoId(null);
      await cargarTurnos();
      setMensaje("Turno modificado correctamente.");

      setTimeout(() => setMensaje(""), 3000);
    } catch {
      setError("Error al modificar el turno.");
    }
  };

  /*CANCELAR TURNO */
  const cancelarTurno = async (id) => {
    if (!window.confirm("¿Seguro que querés cancelar este turno?")) return;

    try {
      await api.patch(`/pacientes/turno/cancelar/${id}`);
      await cargarTurnos();
      setMensaje("Turno cancelado correctamente.");
      setTimeout(() => setMensaje(""), 3000);
    } catch {
      setError("Error al cancelar turno.");
    }
  };

  /* ACTUALIZAR PERFIL */
  const actualizarPerfil = async (tipo) => {
    try {
      const body =
        tipo === "obra_social"
          ? { obra_social: obraSocial }
          : { nueva_contrasena: nuevaPassword };

      await api.put(`/pacientes/actualizar/${paciente.id}`, body);

      setMensaje("Datos actualizados correctamente.");
      setTimeout(() => setMensaje(""), 3000);
    } catch {
      setError("Error al actualizar el perfil.");
    }
  };

  /* RENDER*/
  return (
  <div className="dashboard-bg">
    <div className="dashboard-card">
      <LogoutButton />

      <h2 className="dashboard-title">
        Bienvenido/a, {paciente?.nombre} {paciente?.apellido}
      </h2>

      {/* NAV TABS */}
      <div className="tab-nav">
        <button
          onClick={() => setActiveTab("turnos")}
          className={activeTab === "turnos" ? "active" : ""}
        >
          Turnos
        </button>

        <button
          onClick={() => setActiveTab("perfil")}
          className={activeTab === "perfil" ? "active" : ""}
        >
          Perfil
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={activeTab === "chat" ? "active" : ""}
        >
          Charlar
        </button>
      </div>

      {/* CHAT */}
      {activeTab === "chat" && (
        <>
          <h3 className="subsection-title">Chat con Administración</h3>

          <Chat
            usuario={{
              id: paciente.id,
              nombre: paciente.nombre,
              tipo: "paciente",
            }}
            receptor={{
              id: conversacionActiva?.admin_id || null,
              nombre: conversacionActiva?.admin_nombre || "Administración",
              tipo: "admin",
            }}
            conversacionId={conversacionActiva?.conversacion_id || null}
          />

          {conversacionActiva?.admin_nombre && (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              🟢 Atendido por {conversacionActiva.admin_nombre}
            </p>
          )}
        </>
      )}

            {/* TURNOS */}
      {activeTab === "turnos" && (
        <>
          <h3 className="subsection-title">Solicitar Nuevo Turno</h3>

          <div className="turno-form">
            <div>
              <label>Especialidad</label>
              <select
  value={seleccionada}
  onChange={(e) => {
    handleEspecialidad(e);
    setError("");
  }}
>

                <option value="">Seleccionar</option>
                {especialidades.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Médico</label>
              <select
  value={medico}
  onChange={(e) => {
    handleMedico(e);
    setError("");
  }}
>

                <option value="">Seleccionar</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} {m.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Fecha</label>
              <input
  type="date"
  value={fecha}
  onChange={(e) => {
    setFecha(e.target.value);
    setError("");
  }}
/>

            </div>

            <div>
              <label>Hora</label>
              <select
  value={hora}
  onChange={(e) => {
    setHora(e.target.value);
    setError("");
  }}
>

                <option value="">Seleccionar</option>
                {bloquesDisponibles().map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label>Detalles</label>
              <textarea
                rows="3"
                value={detalles}
                onChange={(e) => setDetalles(e.target.value)}
              />
            </div>
          </div>

          <button className="btn-primary" onClick={solicitarTurno}>
            Solicitar Turno
          </button>

          <h3 className="subsection-title">Mis Turnos</h3>

<div className="table-wrapper">
  <table className="table-modern">
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
          <td>
            {editarTurnoId === t.id ? (
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
              />
            ) : (
              t.fecha.split("T")[0]
            )}
          </td>

          <td>
            {editarTurnoId === t.id ? (
              <select
                value={nuevaHora}
                onChange={(e) => setNuevaHora(e.target.value)}
              >
                <option value="">Seleccionar</option>
                {bloquesEdicion().map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            ) : (
              t.hora
            )}
          </td>

          <td>
            <span
              className={
                t.estado === "en espera"
                  ? "badge badge-espera"
                  : t.estado === "confirmado"
                  ? "badge badge-confirmado"
                  : "badge badge-cancelado"
              }
            >
              {t.estado}
            </span>
          </td>

          <td>{t.nombre_medico} {t.apellido_medico}</td>
          <td>{t.especialidad}</td>

          <td>
            {t.estado === "en espera" &&
              (editarTurnoId === t.id ? (
                <>
                  <button className="table-btn guardar" onClick={() => guardarCambiosTurno(t.id)}>Guardar</button>
                  <button className="table-btn cancelar" onClick={() => setEditarTurnoId(null)}>Cancelar</button>
                </>
              ) : (
                <>
                  <button className="table-btn modificar" onClick={() => iniciarEdicion(t)}>Modificar</button>
                  <button className="table-btn cancelar" onClick={() => cancelarTurno(t.id)}>Cancelar</button>
                </>
              ))}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
        </>
      )}


      {/* PERFIL */}
      {activeTab === "perfil" && (
        <>
          <h3 className="subsection-title">Actualizar Perfil</h3>

          <div className="turno-form">
            <div>
              <label>Obra Social</label>
              <input
                type="text"
                value={obraSocial}
                onChange={(e) => setObraSocial(e.target.value)}
              />
            </div>

            <div>
              <label>Nueva Contraseña</label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => actualizarPerfil("obra_social")}
          >
            Actualizar Obra Social
          </button>

          <button
            className="btn-primary"
            onClick={() => actualizarPerfil("password")}
            style={{ marginLeft: 10 }}
          >
            Actualizar Contraseña
          </button>

          <button
            className="btn-primary"
            style={{ marginTop: 25 }}
            onClick={() => setMostrarMapa(!mostrarMapa)}
          >
            {mostrarMapa ? "Ocultar mapa" : "Ver Clínica"}
          </button>

          {mostrarMapa && <MapaClinica />}
        </>
      )}

      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  </div>
);
}

export default PacienteDashboard;
