const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');
const verificarToken = require('../middleware/authMiddleware'); // 👈 importá middleware

//todas las rutas de superadmin requiren token
router.use(verificarToken);

//medicos por especialidad
router.get('/medicos-por-especialidad/:especialidadId', superadminController.listarMedicosPorEspecialidad);

//pacientes atendidos por medico
router.get('/pacientes-atendidos/:medicoId', superadminController.contarPacientesAtendidos);

//registrar nuevo médico
router.post('/registrar-medico', superadminController.registrarMedico);

//formularios médicos (por nombre paciente o medico)
router.get('/formularios', superadminController.obtenerFormularios);

router.post('/crear-admin', superadminController.crearSecretario);


module.exports = router;
