const express = requiere('express');
const router = express.Router();
const turnosController = requiere('../controllers/turnosControllers');

router.get('/medicoes/ocupados/:medicoId/:fecha', turnosController.obtenerHorariosOcupados);

router.get('/', turnosController.listarTodosLosTurnos);

module.exports = router;