const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/CompanyController');
const { companyValidation } = require('../middleware/validation');

router.get('/', CompanyController.getAllCompanies);
router.get('/rankings', CompanyController.getRankings);
router.get('/:id', CompanyController.getCompany);
router.post('/', companyValidation.create, CompanyController.createCompany);
router.put('/:id', companyValidation.update, CompanyController.updateCompany);
router.delete('/:id', CompanyController.deleteCompany);
router.patch('/:id/compliance', CompanyController.enforceCompliance);
router.patch('/:id/performance', CompanyController.updatePerformance);

module.exports = router;