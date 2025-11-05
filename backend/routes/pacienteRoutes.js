const express = require('express');
const router = express.Router();
const pacienteController = requiere('../controllers/pacienteController');

// Turnos
router.post('/solicitar-turno', pacienteController.solicitarTurno);
router.get('/turnos/:pacienteId', pacienteController.obtenerTurnosPaciente);
router.put('/turno/:id', pacienteController.modificarTurno);
router.path('/turno/cancelar/:id', pacienteController.cancelarTurno);

// Datos del paciente
router.put('/actualizar/:id', pacienteController.actualizarDatosPaciente);
router.put('/cambiar-contrasena/:id', pacienteController.cambiarContrasena);


module.exports = router;