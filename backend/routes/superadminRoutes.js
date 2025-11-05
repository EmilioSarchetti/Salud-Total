const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');

//médicos por especialidad
router.get('/medicos-por-especialidad/:especialidad', superadminController.listarMedicosPorEspecialidad);

//pacientes atendidos por médico
router.get('/pacientes-atendidos/:medicoId', superadminController.contarPacientesAtendidos);

//registrar nuevo médico
router.post('/registrar-medico', superadminController.registrarMedico);

//formularios médicos (por nombre paciente o médico)
router.get('/formularios', superadminController.obtenerFormularios);

router.post('/crear-admin', superadminController.crearSecretario);

module.exports = router;

