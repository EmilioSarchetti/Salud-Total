import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../components/axios";
import { conectarSocket } from "../components/socket";

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Limpia el mensaje sin refrescar la vista
    setError("");
    setCargando(true);

    try {
      const res = await api.post(`${API_URL}/api/auth/login`, {
        email,
        contrasena: password,
      });

      const { token, usuario } = res.data || {};

      if (!usuario || !usuario.tipo) {
        throw new Error("Usuario no válido o sin tipo asignado.");
      }

      // Guarda sesión
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      conectarSocket();

      const rutas = {
        paciente: "/paciente-dashboard",
        medico: "/medico-dashboard",
        admin: "/admin-dashboard",
        superadmin: "/superadmin-dashboard",
      };

      navigate(rutas[usuario.tipo] || "/");
    } catch (err) {
      const mensaje =
        err?.response?.data?.error ||
        err?.response?.data?.mensaje ||
        err?.message ||
        "Error desconocido en inicio de sesión.";

      setError(mensaje); 
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-overlay"></div>

      <div className="auth-card">
        <h2>Iniciar sesión</h2>

        <form className="auth-form" onSubmit={handleLogin}>

          {/* EMAIL */}
          <div className="auth-field">
            <label>Correo electrónico</label>
            <input
              type="email"
              className="auth-input"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(""); 
              }}
              required
            />
          </div>

          {/* CONTRASEÑA */}
          <div className="auth-field">
            <label>Contraseña</label>
            <input
              type="password"
              className="auth-input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(""); 
              }}
              required
            />
          </div>

          <button className="auth-btn" type="submit" disabled={cargando}>
            {cargando ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

        <p className="auth-register">
          ¿No tenés cuenta?{" "}
          <span onClick={() => navigate("/registro")}>Registrate aquí</span>
        </p>
      </div>
    </div>
  );
}

export default Login;
