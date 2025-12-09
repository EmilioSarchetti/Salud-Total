const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnosControllers');

router.get('/medicoes/ocupados/:medicoId/:fecha', turnosController.obtenerHorariosOcupados);

router.get('/', turnosController.listarTodosLosTurnos);

module.exports = router;