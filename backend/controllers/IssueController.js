const IssueService = require('../services/IssueService');
const { AppError, NotFoundError } = require('../utils/errors');

class IssueController {
  async getAllIssues(req, res, next) {
    try {
      const result = await IssueService.getAllIssues(req.query);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(new AppError('Failed to fetch issues', 500));
    }
  }

  async getIssue(req, res, next) {
    try {
      const issue = await IssueService.getIssueById(req.params.id);
      if (!issue) {
        return next(new NotFoundError('Issue'));
      }
      res.json({
        success: true,
        data: issue
      });
    } catch (error) {
      next(new AppError('Failed to fetch issue', 500));
    }
  }

  async createIssue(req, res, next) {
    try {
      const issue = await IssueService.createIssue(req.body);
      res.status(201).json({
        success: true,
        data: issue
      });
    } catch (error) {
      next(new AppError('Failed to create issue', 500));
    }
  }

  async updateIssue(req, res, next) {
    try {
      const issue = await IssueService.updateIssue(req.params.id, req.body);
      if (!issue) {
        return next(new NotFoundError('Issue'));
      }
      res.json({
        success: true,
        data: issue
      });
    } catch (error) {
      next(new AppError('Failed to update issue', 500));
    }
  }

  async resolveIssue(req, res, next) {
    try {
      const issue = await IssueService.resolveIssue(req.params.id, req.body);
      if (!issue) {
        return next(new NotFoundError('Issue'));
      }
      res.json({
        success: true,
        data: issue,
        message: 'Issue resolved successfully'
      });
    } catch (error) {
      next(new AppError('Failed to resolve issue', 500));
    }
  }

  async escalateIssue(req, res, next) {
    try {
      const issue = await IssueService.escalateIssue(req.params.id, req.body);
      if (!issue) {
        return next(new NotFoundError('Issue'));
      }
      res.json({
        success: true,
        data: issue,
        message: 'Issue escalated successfully'
      });
    } catch (error) {
      next(new AppError('Failed to escalate issue', 500));
    }
  }

  async getIssueStats(req, res, next) {
    try {
      const stats = await IssueService.getIssueStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(new AppError('Failed to fetch issue stats', 500));
    }
  }
}

module.exports = new IssueController();