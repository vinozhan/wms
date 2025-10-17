const express = require('express');
const router = express.Router();
const ProgramController = require('../controllers/ProgramController');
const { programValidation } = require('../middleware/validation');

router.get('/', ProgramController.getAllPrograms);
router.get('/:id', ProgramController.getProgram);
router.post('/', programValidation.create, ProgramController.createProgram);
router.put('/:id', ProgramController.updateProgram);
router.patch('/:id/approve', ProgramController.approveProgram);
router.delete('/:id', ProgramController.deleteProgram);

module.exports = router;