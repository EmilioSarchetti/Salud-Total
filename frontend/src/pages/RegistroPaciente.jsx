import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../components/axios";

const API_URL = import.meta.env.VITE_API_URL;

function RegistroPaciente() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [obraSocial, setObraSocial] = useState("");
  const [detallesExtras, setDetallesExtras] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!email.includes("@")) {
      setError("El correo debe ser válido.");
      return;
    }
    if (contrasena.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    try {
      setCargando(true);

      await api.post(`${API_URL}/api/auth/registro`, {
        nombre,
        apellido,
        email,
        contrasena,
        tipo: "paciente",
        obra_social: obraSocial,
        detalles_extras: detallesExtras,
      });

      setMensaje("Registro exitoso. Redirigiendo al login...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.mensaje ||
          "No se pudo registrar el paciente."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-overlay"></div>

      <div className="auth-card">
        <h2>Registro de Paciente</h2>

        <form onSubmit={handleRegistro} className="auth-form">
          <div className="auth-field">
            <label>Nombre</label>
            <input
              className="auth-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Apellido</label>
            <input
              className="auth-input"
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Correo electrónico</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Contraseña</label>
            <input
              className="auth-input"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Obra Social (opcional)</label>
            <input
              className="auth-input"
              type="text"
              value={obraSocial}
              onChange={(e) => setObraSocial(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label>Detalles extras (opcional)</label>
            <textarea
              className="auth-input"
              value={detallesExtras}
              onChange={(e) => setDetallesExtras(e.target.value)}
              rows="3"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={cargando}>
            {cargando ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        {mensaje && <p className="auth-success">{mensaje}</p>}
        {error && <p className="auth-error">{error}</p>}

        <p className="auth-register">
          ¿Ya tenés cuenta?{" "}
          <span onClick={() => navigate("/")}>Iniciar sesión</span>
        </p>
      </div>
    </div>
  );
}

export default RegistroPaciente;
