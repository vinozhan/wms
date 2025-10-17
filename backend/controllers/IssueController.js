const IssueService = require('../services/IssueService');
const { AppError, NotFoundError } = require('../utils/errors');

class IssueController {
  async createIssue(req, res, next) {
  try {
    console.log('Creating issue with data:', req.body);
    
    const issue = await IssueService.createIssue(req.body);
    res.status(201).json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('Error in createIssue:', error);
    next(new AppError('Failed to create issue', 500));
  }
}
  async getAllIssues(req, res, next) {
  try {
    console.log('🔍 [IssueController] getAllIssues called with query:', req.query);
    console.log('📋 [IssueController] Request headers:', req.headers);
    
    const result = await IssueService.getAllIssues(req.query);
    
    console.log('✅ [IssueController] getAllIssues successful');
    console.log(`📊 [IssueController] Found ${result.issues.length} issues out of ${result.total} total`);
    console.log(`📄 [IssueController] Page ${result.currentPage} of ${result.totalPages}`);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ [IssueController] Error in getAllIssues:', error.message);
    console.error('🔍 [IssueController] Error stack:', error.stack);
    console.error('📋 [IssueController] Failed query was:', req.query);
    next(new AppError('Failed to fetch issues', 500));
  }
}

async getIssue(req, res, next) {
  try {
    const { id } = req.params;
    console.log('🔍 [IssueController] getIssue called with ID:', id);
    console.log('📋 [IssueController] Request headers:', req.headers);
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn('⚠️ [IssueController] Invalid issue ID format:', id);
      return next(new ValidationError('Invalid issue ID format'));
    }

    const issue = await IssueService.getIssueById(id);
    
    if (!issue) {
      console.warn('⚠️ [IssueController] Issue not found with ID:', id);
      return next(new NotFoundError('Issue'));
    }
    
    console.log('✅ [IssueController] getIssue successful for ID:', id);
    console.log('📄 [IssueController] Issue found:', {
      id: issue._id,
      title: issue.title,
      status: issue.status,
      assignedTo: issue.assignedTo
    });
    
    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('❌ [IssueController] Error in getIssue:', error.message);
    console.error('🔍 [IssueController] Error stack:', error.stack);
    console.error('📋 [IssueController] Failed ID was:', req.params.id);
    next(new AppError('Failed to fetch issue', 500));
  }
}

//   async createIssue(req, res, next) {
//     try {
//       const issue = await IssueService.createIssue(req.body);
//       res.status(201).json({
//         success: true,
//         data: issue
//       });
//     } catch (error) {
//       next(new AppError('Failed to create issue', 500));
//     }
//   }

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