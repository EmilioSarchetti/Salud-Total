import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { sicket } from "../socket.js";
import { use } from "react";

const API_URL = import.meta.env.VITE_API_URLM;

function Chat({ usuario, receptor, conversacionId: propConversacionId }) {
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const [conversacionId, setConversacionId] = useState(propConversacionId || null);
    const chatEndRef = useRef(null);
    const socketInicializado = useRef(false);

 useEffect(() => {
    const cargarConversacion = async () => {
      if (!usuario?.id) return;

      try {
        let convId = conversacionId;

        if (!convId) {
          const res = await axios.get(`${API_URL}/api/chat/usuario/${usuario.id}`);

          if (res.data.length > 0) {
            let conv = null;

            if (usuario.tipo === "admin" && receptor?.id) {
              conv = res.data.find((c) => c.paciente_id === receptor.id);
            } else if (usuario.tipo === "paciente") {
              conv = res.data[0];
            }

            if (conv) {
              convId = conv.conversacion_id;
              setConversacionId(convId);
            }
          }
        }

        if (convId) {
          const mensajesRes = await axios.get(`${API_URL}/api/chat/mensajes/${convId}`);
          setMensajes(mensajesRes.data);
        }
      } catch (err) {
        console.error("❌ Error al cargar conversación:", err);
      }
    };

    cargarConversacion();
  }, [usuario?.id, receptor?.id]);

  useEffect(() => {
    if (!usuario || socketInicializado.current) return;
    socketInicializado.current = true;
// Evita duplicación si el mensaje ya está
    const handleNuevoMensaje = (msg) => {
      setMensajes((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };
    const handlePendiente = (msg) => {
      if (usuario.tipo === "admin") {
        console.log(`Mensaje pendiente de paciente ${msg.emisor_id}`);
      }
    };
    socket.on("nuevoMensaje", handleNuevoMensaje);
    socket.on("nuevoMensajePendiente", handlePendiente);

    return () => {
      socket.off("nuevoMensaje", handleNuevoMensaje);
      socket.off("nuevoMensajePendiente", handlePendiente);
      socketInicializado.current = false;
    };
    }, [usuario]);

    //envia mensajes
    const enviarMensaje = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim()) return;

        try {
            const body = {
                emisor_id: usuario.id,
                emisor_tipo: usuario.tipo,
                mensaje: nuevoMensaje.trim(),
                receptor_id: receptor?.id || null,
                receptor_tipo: receptor?.tipo || "admin",
            };

        const res = await axios.post(`${API_URL}/api/chat/enviar`, body);
        const mensajeNuevo = res.data;

              if (!conversacionId && mensajeNuevo.conversacion_id) {
        setConversacionId(mensajeNuevo.conversacion_id);
            }

        setMensajes((prev) => {
            if (prev.some((m) => m.id === mensajeNuevo.id)) return prev;
            return [...prev, mensajeNuevo];
        });

        setNuevoMensaje("");
            } catch (err) {
            console.error("Error al enviar mensaje:", err);
            }
        };

    //mantener el chat al final
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes.length]);    

    //interfaz del chat
    return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>{receptor?.nombre || "Administración"}</h3>
      </div>

      <div className="chat-box">
        {mensajes.length === 0 ? (
          <p>No hay mensajes todavía.</p>
        ) : (
          mensajes.map((m) => (
            <div
              key={m.id}
              className={`mensaje ${
                m.emisor_id === usuario.id ? "propio" : "ajeno"
              }`}
            >
              <div className="mensaje-info">
                <strong>
                  {m.emisor_tipo === "admin"
                    ? "Admin"
                    : m.emisor_nombre || "Paciente"}
                </strong>
                <span className="hora">
                  {new Date(m.fecha_envio).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p>{m.mensaje}</p>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {usuario.tipo !== "medico" && usuario.tipo !== "superadmin" && (
        <form onSubmit={enviarMensaje} className="chat-input">
          <input
            type="text"
            placeholder="Escribí un mensaje..."
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
          />
          <button type="submit">Enviar</button>
        </form>
      )}
    </div>
  );

}