const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/CompanyController');
const { validateCompany } = require('../middleware/validation');

router.get('/', CompanyController.getAllCompanies);
router.get('/rankings', CompanyController.getRankings);
router.get('/:id', CompanyController.getCompany);
router.post('/', validateCompany, CompanyController.createCompany); // Add validation
router.put('/:id', validateCompany, CompanyController.updateCompany); // Add validation
router.delete('/:id', CompanyController.deleteCompany);
router.patch('/:id/compliance', CompanyController.enforceCompliance);
router.patch('/:id/performance', CompanyController.updatePerformance);

module.exports = router;