<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');

// Turnos
router.post('/solicitar-turno', pacienteController.solicitarTurno);
router.get('/turnos/:pacienteId', pacienteController.obtenerTurnosPaciente);
router.put('/turno/:id', pacienteController.modificarTurno);
router.patch('/turno/cancelar/:id', pacienteController.cancelarTurno);

// Datos del paciente
router.put('/actualizar/:id', pacienteController.actualizarDatosPaciente);
router.put('/cambiar-contrasena/:id', pacienteController.cambiarContrasena);
router.get('/turnos/recordatorio', pacienteController.turnosParaRecordatorio);
router.patch('/turnos/recordatorio/:turnoId', pacienteController.marcarRecordatorio);


=======
const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');

// Turnos
router.post('/solicitar-turno', pacienteController.solicitarTurno);
router.get('/turnos/:pacienteId', pacienteController.obtenerTurnosPaciente);
router.put('/turno/:id', pacienteController.modificarTurno);
router.patch('/turno/cancelar/:id', pacienteController.cancelarTurno);

// Datos del paciente
router.put('/actualizar/:id', pacienteController.actualizarDatosPaciente);
router.put('/cambiar-contrasena/:id', pacienteController.cambiarContrasena);

router.get('/turnos/recordatorio', pacienteController.turnosParaRecordatorio);
router.patch('/turnos/recordatorio/:turnoId', pacienteController.marcarRecordatorio);


>>>>>>> 316f8a7ba45d30582304a1b1663ebff3e3f72e9d
module.exports = router;