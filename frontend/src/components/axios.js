import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: `${API_URL}/api`,
});

//Interceptor para añadir token y validar expiración
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const { exp } = jwtDecode(token);
        if (Date.now() >= exp * 1000) {
          alert("Tu sesión expiró. Por favor, inicia sesión nuevamente.");
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject("Token expirado");
        }
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error("Error decodificando token:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
