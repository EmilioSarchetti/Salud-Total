<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnosControllers');

router.get('/medicoes/ocupados/:medicoId/:fecha', turnosController.obtenerHorariosOcupados);

router.get('/', turnosController.listarTodosLosTurnos);

module.exports = router;
=======
const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnosController');

router.get('/medicos/ocupados/:medicoId/:fecha', turnosController.obtenerHorariosOcupados);

router.get('/', turnosController.listarTodosLosTurnos);

module.exports = router;
>>>>>>> 316f8a7ba45d30582304a1b1663ebff3e3f72e9d
