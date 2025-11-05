import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

function RegistroPaciente() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [obraSocial, setObraSocial] = useState('');
  const [detallesExtras, setDetallesExtras] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    try {
      const res = await axios.post(`${API_URL}/api/auth/registro`, {
        nombre,
        apellido,
        email,
        contrasena,
        tipo: 'paciente',
        obra_social: obraSocial,
        detalles_extras: detallesExtras
      });

      setMensaje(res.data.mensaje);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError('No se pudo registrar el paciente.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Registro de Paciente</h2>
      <form onSubmit={handleRegistro}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        /><br /><br />
        <input
          type="text"
          placeholder="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
        /><br /><br />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br /><br />
        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
        /><br /><br />
        <input
          type="text"
          placeholder="Obra Social (opcional)"
          value={obraSocial}
          onChange={(e) => setObraSocial(e.target.value)}
        /><br /><br />
        <textarea
          placeholder="Detalles extras (opcional)"
          value={detallesExtras}
          onChange={(e) => setDetallesExtras(e.target.value)}
          rows="4"
        /><br /><br />
        <button type="submit">Registrarse</button>
      </form>
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default RegistroPaciente;
