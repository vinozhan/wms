const ProgramService = require('../services/ProgramService');
const { AppError, NotFoundError } = require('../utils/errors');

class ProgramController {
  async getAllPrograms(req, res, next) {
    try {
      const result = await ProgramService.getAllPrograms(req.query);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(new AppError('Failed to fetch programs', 500));
    }
  }

  async getProgram(req, res, next) {
    try {
      const program = await ProgramService.getProgramById(req.params.id);
      if (!program) {
        return next(new NotFoundError('Program'));
      }
      res.json({
        success: true,
        data: program
      });
    } catch (error) {
      next(new AppError('Failed to fetch program', 500));
    }
  }

  async createProgram(req, res, next) {
    try {
      const program = await ProgramService.createProgram(req.body);
      res.status(201).json({
        success: true,
        data: program
      });
    } catch (error) {
      next(new AppError('Failed to create program', 500));
    }
  }

  async updateProgram(req, res, next) {
    try {
      const program = await ProgramService.updateProgram(req.params.id, req.body);
      if (!program) {
        return next(new NotFoundError('Program'));
      }
      res.json({
        success: true,
        data: program
      });
    } catch (error) {
      next(new AppError('Failed to update program', 500));
    }
  }

  async approveProgram(req, res, next) {
    try {
      const program = await ProgramService.approveProgram(req.params.id, req.body);
      if (!program) {
        return next(new NotFoundError('Program'));
      }
      res.json({
        success: true,
        data: program,
        message: 'Program approved successfully'
      });
    } catch (error) {
      next(new AppError('Failed to approve program', 500));
    }
  }

  async deleteProgram(req, res, next) {
    try {
      const program = await ProgramService.deleteProgram(req.params.id);
      if (!program) {
        return next(new NotFoundError('Program'));
      }
      res.json({
        success: true,
        message: 'Program deleted successfully'
      });
    } catch (error) {
      next(new AppError('Failed to delete program', 500));
    }
  }
}

module.exports = new ProgramController();