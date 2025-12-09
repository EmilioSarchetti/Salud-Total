import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../styles.css";
import LogoutButton from "../components/LogoutButton";
import api from "../components/axios";

function SuperAdminDashboard() {
  const { state } = useLocation();
  const superadmin =
    state?.usuario ||
    JSON.parse(localStorage.getItem("usuario") || "null");

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");

  const [especialidades, setEspecialidades] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [horarios, setHorarios] = useState([]);

  const [mensaje, setMensaje] = useState("");

  const [formularios, setFormularios] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtromedicoEmail, setFiltromedicoEmail] = useState("");

  const [medicos, setMedicos] = useState([]);
  const [especialidadId, setEspecialidadId] = useState("");
  const [pacientesAtendidos, setPacientesAtendidos] = useState(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const [activeTab, setActiveTab] = useState("registrar");

  // LIMPIAR ERRORES AL CAMBIAR DE TAB
  useEffect(() => {
    setMensaje("");
  }, [activeTab]);

  // Cargar especialidades
  useEffect(() => {
    setEspecialidades([
      { id: 1, nombre: "Clínica" },
      { id: 2, nombre: "Pediatría" },
      { id: 3, nombre: "Cardiología" },
      { id: 4, nombre: "Ginecología" },
    ]);
  }, []);

  const toggleEspecialidad = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const agregarHorario = () => {
    setHorarios((prev) => [
      ...prev,
      { dia_semana: "", hora_inicio: "", hora_fin: "" },
    ]);
  };

  const actualizarHorario = (i, campo, valor) => {
    const nuevos = [...horarios];
    nuevos[i][campo] = valor;
    setHorarios(nuevos);
  };

  // Registrar médico
  const registrarMedico = async () => {
    if (!nombre || !apellido || !email || !contrasena) {
      setMensaje("Completa todos los campos.");
      return;
    }
    if (seleccionadas.length === 0) {
      setMensaje("Debes seleccionar al menos una especialidad.");
      return;
    }
    if (horarios.length === 0) {
      setMensaje("Agrega al menos un horario.");
      return;
    }

    try {
      const res = await api.post("/superadmin/registrar-medico", {
        nombre,
        apellido,
        email,
        contrasena,
        tipo: "medico",
        especialidades: seleccionadas,
        horarios,
      });

      setMensaje(res.data.mensaje || "Médico registrado.");

      setNombre("");
      setApellido("");
      setEmail("");
      setContrasena("");
      setSeleccionadas([]);
      setHorarios([]);
    } catch {
      setMensaje("Error al registrar médico.");
    }
  };

  // Crear admin
  const crearAdmin = async () => {
    if (!nombre || !apellido || !email || !contrasena) {
      setMensaje("Completa todos los campos.");
      return;
    }

    try {
      const res = await api.post("/superadmin/crear-admin", {
        nombre,
        apellido,
        email,
        contrasena,
      });

      setMensaje(res.data.mensaje || "Administrador creado.");
      setNombre("");
      setApellido("");
      setEmail("");
      setContrasena("");
    } catch {
      setMensaje("Error al crear administrador.");
    }
  };

  // Buscar médicos
  const buscarMedicosPorEspecialidad = async () => {
    if (!especialidadId) return;

    try {
      const res = await api.get(
        `/superadmin/medicos-por-especialidad/${especialidadId}`
      );
      setMedicos(res.data || []);
    } catch {
      setMensaje("Error al buscar médicos.");
    }
  };

  const obtenerCantidadAtendidos = async (id) => {
    try {
      const res = await api.get(`/superadmin/pacientes-atendidos/${id}`, {
        params: { desde, hasta },
      });
      setPacientesAtendidos({ id, cantidad: res.data.cantidad });
    } catch {
      setMensaje("Error al obtener pacientes atendidos.");
    }
  };

  // Formularios
  const buscarFormularios = async () => {
    try {
      const res = await api.get("/superadmin/formularios", {
        params: {
          nombre_completo: filtroNombre,
          medico_email: filtromedicoEmail,
        },
      });
      setFormularios(res.data || []);
    } catch {
      setMensaje("Error al buscar formularios.");
    }
  };

  return (
    <div className="admin-bg">
      <div className="admin-card">

        <LogoutButton />

        <h2 className="dashboard-title">Panel del SuperAdministrador</h2>
        <h4>
          Bienvenido/a {superadmin?.nombre} {superadmin?.apellido}
        </h4>

        {/* TABS  */}
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === "registrar" ? "active" : ""}`}
            onClick={() => setActiveTab("registrar")}
          >
            Registrar Médico
          </button>

          <button
            className={`tab-btn ${
              activeTab === "crear-admin" ? "active" : ""
            }`}
            onClick={() => setActiveTab("crear-admin")}
          >
            Crear Admin
          </button>

          <button
            className={`tab-btn ${activeTab === "buscar" ? "active" : ""}`}
            onClick={() => setActiveTab("buscar")}
          >
            Buscar Médicos
          </button>

          <button
            className={`tab-btn ${
              activeTab === "formularios" ? "active" : ""
            }`}
            onClick={() => setActiveTab("formularios")}
          >
            Formularios
          </button>
        </div>

        {/* ---- CONTENIDO DE TABS ---- */}
        <div className="tab-content">

          {/* REGISTRAR MÉDICO */}
          {activeTab === "registrar" && (
            <>
              <h3 className="subsection-title">Registrar Médico</h3>

              <div className="turno-form">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
              </div>

              <h4 className="subsection-title">Especialidades</h4>
              {especialidades.map((e) => (
                <label key={e.id} style={{ display: "block", marginBottom: 6 }}>
                  <input
                    type="checkbox"
                    checked={seleccionadas.includes(e.id)}
                    onChange={() => toggleEspecialidad(e.id)}
                  />
                  {" "} {e.nombre}
                </label>
              ))}

              <h4 className="subsection-title">Horarios</h4>
              {horarios.map((h, i) => (
                <div key={i} className="turno-form">
                  <select
                    value={h.dia_semana}
                    onChange={(e) =>
                      actualizarHorario(i, "dia_semana", e.target.value)
                    }
                  >
                    <option value="">Día</option>
                    {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
                      .map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <input
                    type="time"
                    value={h.hora_inicio}
                    onChange={(e) =>
                      actualizarHorario(i, "hora_inicio", e.target.value)
                    }
                  />

                  <input
                    type="time"
                    value={h.hora_fin}
                    onChange={(e) =>
                      actualizarHorario(i, "hora_fin", e.target.value)
                    }
                  />
                </div>
              ))}

              <button onClick={agregarHorario}>Agregar Horario</button>
              <button className="btn-primary" onClick={registrarMedico}>
                Registrar Médico
              </button>

              {mensaje && <p className="ok-msg">{mensaje}</p>}
            </>
          )}

          {/* CREAR ADMIN */}
          {activeTab === "crear-admin" && (
            <>
              <h3 className="subsection-title">Crear Administrador</h3>

              <div className="turno-form">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
              </div>

              <button className="btn-primary" onClick={crearAdmin}>
                Crear Admin
              </button>

              {mensaje && <p className="ok-msg">{mensaje}</p>}
            </>
          )}

          {/* BUSCAR MÉDICOS */}
          {activeTab === "buscar" && (
            <>
              <h3 className="subsection-title">Buscar Médicos por Especialidad</h3>

              <div className="turno-form">
                <select
                  value={especialidadId}
                  onChange={(e) => setEspecialidadId(e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {especialidades.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>

                <button onClick={buscarMedicosPorEspecialidad}>
                  Buscar
                </button>
              </div>

              {medicos.length > 0 && (
                <ul>
                  {medicos.map((m) => (
                    <li key={m.id} style={{ marginBottom: 12 }}>
                      <strong>{m.nombre} {m.apellido}</strong> ({m.email})
                      <br />

                      <div className="turno-form">
                        <input
                          type="date"
                          value={desde}
                          onChange={(e) => setDesde(e.target.value)}
                        />
                        <input
                          type="date"
                          value={hasta}
                          onChange={(e) => setHasta(e.target.value)}
                        />
                      </div>

                      <button
                        onClick={() => obtenerCantidadAtendidos(m.id)}
                        className="btn-primary"
                      >
                        Ver pacientes atendidos
                      </button>

                      {pacientesAtendidos?.id === m.id && (
                        <p>
                          Pacientes atendidos:{" "}
                          <strong>{pacientesAtendidos.cantidad}</strong>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* FORMULARIOS */}
          {activeTab === "formularios" && (
            <>
              <h3 className="subsection-title">Buscar Formularios</h3>

              <div className="turno-form">
                <input
                  type="text"
                  placeholder="Nombre del paciente"
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Email del médico"
                  value={filtromedicoEmail}
                  onChange={(e) => setFiltromedicoEmail(e.target.value)}
                />
              </div>

              <button className="btn-primary" onClick={buscarFormularios}>
                Buscar
              </button>

              {formularios.length > 0 && (
                <ul>
                  {formularios.map((f) => (
                    <li key={f.id} style={{ marginBottom: 20 }}>
                      <strong>{f.nombre_completo}</strong>
                      <br />
                      <small>{new Date(f.fecha).toLocaleString()}</small>
                      <pre style={{ whiteSpace: "pre-wrap" }}>
                        {f.contenido}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}

              {mensaje && <p className="ok-msg">{mensaje}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
