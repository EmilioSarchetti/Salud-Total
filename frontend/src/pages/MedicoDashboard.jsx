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

    // Formularios clínicos: crear
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

  // Formularios clínicos: buscar por nombre
  const buscarFormularios = async () => {
    if (!nombrePaciente.trim()) {
      setMensajeFormulario('Ingrese un nombre a buscar.');
      return;
    }

    try {
      const res = await axios.get(
        `${API_URL}/api/medicoes/formularios-nombre/${encodeURIComponent(
          nombrePaciente.trim()
        )}`
      );

// res.data puede ser array, o puede venir 1 solo objeto según el backend
      const data = Array.isArray(res.data) ? res.data : [res.data];

      setListaVisible(data);
      if (!data.length) {
        setMensajeFormulario('No se encontraron formularios.');
      } else {
        setMensajeFormulario('');
      }
    } catch (err) {
      // puede venir 404 si no hay resultados
      if (err.response && err.response.status === 404) {
        setListaVisible([]);
        setMensajeFormulario('No se encontraron formularios.');
      } else {
        console.error(err);
        setMensajeFormulario('Error al buscar formularios.');
      }
    }
  };

  // Formularios clínicos: ver mis formularios
  const obtenerFormulariosDelmedico = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/medicoes/formularios/${medico.id}`
      );

      setListaVisible(res.data || []);
      setMensajeFormulario('');
    } catch (err) {
      console.error(err);
      setListaVisible([]);
      setMensajeFormulario('Error al obtener formularios del medico.');
    }
  };

   // Formularios clínicos: edición
const empezarEdicion = (form) => {
    setEditarFormularioId(form.id);
    setFormularioEditado(form.contenido || '');
    setMensajeFormulario(
      `Editando el formulario de "${form.nombre_completo}" (ID ${form.id})`
    );
  };

  // Formularios clínicos: guardar edición 
  const guardarEdicionFormulario = async () => {
    if (!editarFormularioId) return;

    try {
      const fecha = new Date().toLocaleDateString('es-AR');
      const nuevoMotivo = prompt('Nuevo motivo de consulta:') || 'Sin motivo';
      const nuevoTratamiento =
        prompt('Nuevo tratamiento:') || 'Sin tratamiento';

      const nuevaEntrada =
        `\n---\nFecha: ${fecha}\nMotivo: ${nuevoMotivo}\nTratamiento: ${nuevoTratamiento}\n`;

      const nuevoContenido = `${formularioEditado}${nuevaEntrada}`;

      await axios.put(
        `${API_URL}/api/medicoes/formulario/${editarFormularioId}`,
        {
          contenido: nuevoContenido
        }
      );

      setMensajeFormulario('Formulario actualizado correctamente.');
      setEditarFormularioId(null);
      setFormularioEditado('');

      // refrescar la lista visible
      obtenerFormulariosDelmedico();
    } catch (err) {
      console.error(err);
      alert('Error al editar el formulario.');
    }
  };

// RENDER
return (
    <div className="container">
      {/* logout */}
      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <h2>
        Panel del medico/a {medico?.nombre} {medico?.apellido}
      </h2>

      <div className="tabs-container">
        {/* ---------- TABS ---------- */}
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'turnos' ? 'active' : ''}`}
            onClick={() => setActiveTab('turnos')}
          >
            Turnos
          </button>
          <button
            className={`tab-btn ${activeTab === 'horarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('horarios')}
          >
            Horarios
          </button>
          <button
            className={`tab-btn ${
              activeTab === 'formularios' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('formularios')}
          >
            Formularios
          </button>
          <button
            className={`tab-btn ${
              activeTab === 'password' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('password')}
          >
            Contraseña
          </button>
        </div>

        {/*CONTENIDO DE CADA TAB*/}
        <div className="tab-content">
          {/* TAB TURNOS */}
          {activeTab === 'turnos' && (
            <>
              <h3>Gestión de Turnos</h3>

              <label>Filtrar por fecha:</label>
              <input type="date" value={filtroFecha} onChange={cambiarFecha} />

              {mensaje && <p className="ok-msg">{mensaje}</p>}
              {error && <p className="err-msg">{error}</p>}

              {turnos.map((turno) => (
                <div key={turno.id} className="card">
                  <p>
                    <strong>Paciente:</strong> {turno.paciente_nombre}{' '}
                    {turno.paciente_apellido}
                  </p>
                  <p>
                    <strong>Fecha:</strong>{' '}
                    {new Date(turno.fecha).toLocaleDateString('es-AR')}
                  </p>
                  <p>
                    <strong>Hora:</strong> {turno.hora}
                  </p>
                  <p>
                    <strong>Estado:</strong> {turno.estado}
                  </p>

                  <select
                    value={turno.estado}
                    onChange={(e) =>
                      cambiarEstado(turno.id, e.target.value)
                    }
                  >
                    <option value="en espera">En Espera</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="atendido">Atendido</option>
                  </select>
                </div>
              ))}

              {turnos.length === 0 && (
                <p>No hay turnos para esa fecha.</p>
              )}
            </>
          )}

          {/* TAB HORARIOS */}
          {activeTab === 'horarios' && (
            <>
              <h3>Horarios de Atención</h3>

              {horarios.map((h, i) => (
                <div key={i} className="card">
                  <p>
                    {h.dia_semana} — {h.hora_inicio} a {h.hora_fin}
                  </p>
                  <button
                    onClick={() => eliminarHorario(i)}
                    style={{ marginLeft: '1rem' }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}

              {horarios.length === 0 && (
                <p>Aún no cargaste horarios.</p>
              )}

              <div className="inline-form">
                <select
                  value={nuevoHorario.dia_semana}
                  onChange={(e) =>
                    actualizarHorario('dia_semana', e.target.value)
                  }
                >
                  <option value="">Día</option>
                  {[
                    'Lunes',
                    'Martes',
                    'Miércoles',
                    'Jueves',
                    'Viernes',
                    'Sábado'
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={nuevoHorario.hora_inicio}
                  onChange={(e) =>
                    actualizarHorario('hora_inicio', e.target.value)
                  }
                />
                <input
                  type="time"
                  value={nuevoHorario.hora_fin}
                  onChange={(e) =>
                    actualizarHorario('hora_fin', e.target.value)
                  }
                />

                <button onClick={guardarHorarios}>Agregar Horario</button>
              </div>
            </>
          )}

          {/*TAB FORMULARIOS */}
          {activeTab === 'formularios' && (
            <>
              <h3>Formularios Médicos / Historial Clínico</h3>

              {/* CREAR NUEVO FORMULARIO */}
              <div className="card">
                <p className="section-title">
                  Nuevo formulario / evolución
                </p>
                <input
                  type="text"
                  placeholder="DNI"
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                />
                <textarea
                  rows={10}
                  cols={50}
                  value={formulario}
                  onChange={(e) => setFormulario(e.target.value)}
                />

                <button onClick={enviarFormulario}>
                  Guardar en historial
                </button>
              </div>

              {/* BUSCAR / VER MIS PACIENTES */}
              <div className="inline-form">
                <button onClick={buscarFormularios}>
                  Buscar por nombre del paciente
                </button>
                <button onClick={obtenerFormulariosDelmedico}>
                  Ver mis formularios
                </button>
              </div>

              {mensajeFormulario && (
                <p className="info-msg">{mensajeFormulario}</p>
              )}

              {/* LISTA VISIBLE DE FORMULARIOS */}
              {listaVisible.map((f) => (
                <div key={f.id} className="card">
                  <p>
                    <strong>Paciente:</strong> {f.nombre_completo}
                  </p>
                  <p>
                    <strong>Fecha:</strong>{' '}
                    {f.fecha
                      ? new Date(f.fecha).toLocaleString('es-AR')
                      : '—'}
                  </p>

                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      background: '#f6f6f6ff',
                      padding: '0.5rem',
                      borderRadius: '4px'
                    }}
                  >
                    {f.contenido}
                  </pre>

                  <button onClick={() => empezarEdicion(f)}>
                    Editar / Agregar nota
                  </button>
                </div>
              ))}

              {listaVisible.length === 0 && (
                <p>No hay formularios para mostrar.</p>
              )}

              {/* BLOQUE DE EDICIÓN ACTIVA */}
              {editarFormularioId && (
                <div className="card warning-box">
                  <p>
                    <strong>
                      Editando Formulario #{editarFormularioId}
                    </strong>
                  </p>
                  <textarea
                    rows={8}
                    cols={50}
                    value={formularioEditado}
                    onChange={(e) =>
                      setFormularioEditado(e.target.value)
                    }
                  />
                  <button onClick={guardarEdicionFormulario}>
                    Guardar edición / Agregar nueva evolución
                  </button>
                  <button
                    onClick={() => {
                      setEditarFormularioId(null);
                      setFormularioEditado('');
                    }}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </>
          )}

          {/*TAB CONTRASEÑA */}
          {activeTab === 'password' && (
            <>
              <h3>Cambiar Contraseña</h3>
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
              />
              <button onClick={cambiarContrasena}>
                Actualizar contraseña
              </button>

              {mensajeContrasena && (
                <p className="info-msg">{mensajeContrasena}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default medicoDashboard;