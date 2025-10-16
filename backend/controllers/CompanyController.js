const CompanyService = require('../services/CompanyService');
const { AppError, NotFoundError } = require('../utils/errors'); // Fixed import

class CompanyController {
  async getAllCompanies(req, res, next) {
    try {
      const result = await CompanyService.getAllCompanies(req.query);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(new AppError('Failed to fetch companies', 500));
    }
  }

  async getCompany(req, res, next) {
    try {
      const company = await CompanyService.getCompanyById(req.params.id);
      if (!company) {
        return next(new NotFoundError('Company'));
      }
      res.json({
        success: true,
        data: company
      });
    } catch (error) {
      next(new AppError('Failed to fetch company', 500));
    }
  }

  async createCompany(req, res, next) {
    try {
      const company = await CompanyService.createCompany(req.body);
      res.status(201).json({
        success: true,
        data: company
      });
    } catch (error) {
      if (error.code === 11000) {
        return next(new AppError('Company with this registration number already exists', 400));
      }
      next(new AppError('Failed to create company', 500));
    }
  }

  async updateCompany(req, res, next) {
    try {
      const company = await CompanyService.updateCompany(req.params.id, req.body);
      if (!company) {
        return next(new NotFoundError('Company'));
      }
      res.json({
        success: true,
        data: company
      });
    } catch (error) {
      next(new AppError('Failed to update company', 500));
    }
  }

  async deleteCompany(req, res, next) {
    try {
      const company = await CompanyService.deleteCompany(req.params.id);
      if (!company) {
        return next(new NotFoundError('Company'));
      }
      res.json({
        success: true,
        message: 'Company deleted successfully'
      });
    } catch (error) {
      next(new AppError('Failed to delete company', 500));
    }
  }

  async getRankings(req, res, next) {
    try {
      const rankings = await CompanyService.getCompanyRankings();
      res.json({
        success: true,
        data: rankings
      });
    } catch (error) {
      next(new AppError('Failed to fetch rankings', 500));
    }
  }

  async enforceCompliance(req, res, next) {
    try {
      const { action } = req.body;
      const company = await CompanyService.enforceCompliance(req.params.id, action);
      if (!company) {
        return next(new NotFoundError('Company'));
      }
      res.json({
        success: true,
        data: company,
        message: `Compliance action '${action}' applied successfully`
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async updatePerformance(req, res, next) {
    try {
      const company = await CompanyService.updateCompanyPerformance(req.params.id, req.body);
      if (!company) {
        return next(new NotFoundError('Company'));
      }
      res.json({
        success: true,
        data: company
      });
    } catch (error) {
      next(new AppError('Failed to update performance', 500));
    }
  }
}

module.exports = new CompanyController();