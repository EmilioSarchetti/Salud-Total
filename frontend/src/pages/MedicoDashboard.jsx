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
    .get(´$)
})
}