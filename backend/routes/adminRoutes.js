const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

//listar médicos por especialidad 
router.get(
    '/medicos-por-especialidad/:especialidadId',
    adminController.listarMedicosPorEspecialidad
);

//contar pacientes atendidos (por médico)
router.get(
    '/pacientes-atendidos/:medicoId',
    adminController.contarPacientesAtendidos
);

//formularios médicos
router.get('/formularios', adminController.obtenerFormularios);

//turnos (opcional para secretaria)
router.get('/turnos', adminController.listarTurnos);
router.put('/turnos/estado', adminController.actualizarEstadoTurno);

module.exports = router;