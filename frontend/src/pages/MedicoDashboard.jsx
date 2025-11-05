import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import '../styles.css';

const API_URL = import.meta.env.VITE_API_URL;

function medicoDashboard(){
    const { state } = useLocation();
    const medico = state?.usuario;

//Estados generales
consta [activeTab, setActiveTab] = useState('turnos');

//Turnos
const [turnos, setTurnos] = useState('turnos');
const [todosLosturnos, setTodosLosTurnos] = useState([]);
const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);
const [mensaje, setMensaje] = useState('');
const [error, setError] = useState('');

//Horarios
const [horarios, setHorarios] = useState ([]);
const [nuevoHorario, setNuevoHorario] = useState({
    dia_semana: '',
    hora_inicio: '',
    hora_fin: ''
});

//Contraseña
const [nuevaContrasena, setNuevaContrasena] = useState('');
const [mensajeContrasena, setMensajeContrasena] = useState('');

//Formularios Clinicos
const [nombrePaciente, setNombrePaciente] = useState('');
const [formlario, setFormulario] = useState('Nombre:\nEdad:\nPeso:\nAltura:\nMotivo de consulta:\nTratamiento:'
);
const [mensajeFormulario, setMnesajeFormulario] = useState('');
const [listaVisible, setListaVisible] = useState([]); //se renderiza siempre

//edición 
const [editarFormularioId, setEditaFormularioId] = useState(null);
const [formularioEditado, setFormularioEditado] = useState('');

//Cargar turnos y horarios al crear el dashboard
useEffect(() => {
    if(!medico) return;

    //Turnos del medico
    axios
      .get(`${API_URL}/api/medicoes/turnos/${medico.id}`)
      .then((res) => {
        setTodosLosTurnos(res.data);
        const hoy = new Date().toISOString().split('T')[0];
        const turnosDeHoy = res.data.filter(
          (turno) =>
            new Date(turno.fecha).toISOString().split('T')[0] === hoy
        );
        setTurnos(turnosDeHoy);
      })
      .catch(() => setError('Error al cargar los turnos.'));

      // Horarios del medico
    axios
      .get(`${API_URL}/api/medicoes/horarios/${medico.id}`)
      .then((res) => setHorarios(res.data))
      .catch(() => console.error('Error al obtener horarios.'));
  }, [medico, API_URL]);

  // Helpers
  const handleLogout = () => {
    window.location.href = '/';
  };

  const formatearHora = (hora) =>
    hora && hora.length === 5 ? `${hora}:00` : hora;

  // Gestión Turnos
  const cambiarFecha = (e) => {
    const fechaSeleccionada = e.target.value;
    setFiltroFecha(fechaSeleccionada);

    const filtrados = todosLosTurnos.filter(
      (turno) =>
        new Date(turno.fecha).toISOString().split('T')[0] ===
        fechaSeleccionada
    );
    setTurnos(filtrados);
  };

  const cambiarEstado = async (turnoId, nuevoEstado) => {
    setMensaje('');
    setError('');

    try {
      await axios.put(
        `${API_URL}/api/medicoes/turnos/${turnoId}`,
        { estado: nuevoEstado }
      );

      setMensaje('Estado actualizado.');

        // refrescar lista de turnos
      const res = await axios.get(
        `${API_URL}/api/medicoes/turnos/${medico.id}`
      );
      setTodosLosTurnos(res.data);

      const filtrados = res.data.filter(
        (turno) =>
          new Date(turno.fecha).toISOString().split('T')[0] ===
          filtroFecha
      );
      setTurnos(filtrados);
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el estado.');
    }
  };

  // Gestión Horarios
  const actualizarHorario = (campo, valor) => {
    setNuevoHorario((prev) => ({
      ...prev,
      [campo]: campo.includes('hora') ? formatearHora(valor) : valor
    }));
  };

  const eliminarHorario = (index) => {
    const nuevos = horarios.filter((_, i) => i !== index);
    setHorarios(nuevos);

    axios
      .put(
        `${API_URL}/api/medicoes/actualizar-horarios/${medico.id}`,
        { horarios: nuevos }
      )
      .then(() => setMensaje('Horario eliminado correctamente.'))
      .catch(() => setError('Error al eliminar horario.'));
  };

  const guardarHorarios = async () => {
    try {
      const nuevos = [...horarios, nuevoHorario];

      await axios.put(
        `${API_URL}/api/medicoes/actualizar-horarios/${medico.id}`,
        { horarios: nuevos }
      );

      setHorarios(nuevos);
      setNuevoHorario({ dia_semana: '', hora_inicio: '', hora_fin: '' });
      setMensaje('Horario actualizado correctamente.');
    } catch (err) {
      console.error('Error al actualizar los horarios.');
      setError('Error al actualizar los horarios.');
    }
  };

  // Gestión Contraseña
  const cambiarContrasena = async () => {
    setMensajeContrasena('');

    if (!nuevaContrasena) {
      setMensajeContrasena('La nueva contraseña no puede estar vacía.');
      return;
    }

    try {
      await axios.put(
        `${API_URL}/api/medicoes/cambiar-contrasena/${medico.id}`,
        { nueva_contrasena: nuevaContrasena }
      );
      setMensajeContrasena('Contraseña actualizada correctamente.');
      setNuevaContrasena('');
    } catch (err) {
      console.error(err);
      setMensajeContrasena('Error al actualizar la contraseña.');
    }
  };

    // Crear formularios clínicos
    const enviarFormulario = async () => {
    if (!nombrePaciente.trim()) {
      setMensajeFormulario('Ingrese el nombre del paciente.');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/medicoes/formulario`, {
        medico_id: medico.id,
        nombre_completo: nombrePaciente.trim(),
        contenido: formulario
      });

      setMensajeFormulario(res.data.mensaje || 'Formulario enviado.');
      setNombrePaciente('');
      setFormulario(
        'Nombre:\nEdad:\nPeso:\nAltura:\nMotivo de consulta:\nTratamiento:'
      );

    //refresco vista del listado del medico
    obtenerFormulariosDelmedico();
    } catch (err) {
      console.error(err);
      setMensajeFormulario('Error al enviar el formulario.');
    }
  };
}