const Issue = require('../models/Issue');
const Company = require('../models/Company');

class IssueService {
  async getAllIssues(filters = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      type,
      assignedTo
    } = filters;

    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (assignedTo) query.assignedTo = assignedTo;

    const issues = await Issue.find(query)
      .populate('assignedTo', 'name contact.email')
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Issue.countDocuments(query);

    return {
      issues,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    };
  }

  async getIssueById(id) {
    return await Issue.findById(id).populate('assignedTo', 'name contact.email');
  }

  async createIssue(issueData) {
  try {
    console.log('IssueService creating issue with data:', issueData);
    
    // Remove assignedTo if it's empty string to avoid validation errors
    const cleanIssueData = { ...issueData };
    if (cleanIssueData.assignedTo === '') {
      delete cleanIssueData.assignedTo;
    }

    console.log('Cleaned issue data for creation:', cleanIssueData);

    // Use cleanIssueData instead of issueData
    const issue = new Issue(cleanIssueData);
    const savedIssue = await issue.save();

    // Update company issues count if assigned
    if (savedIssue.assignedTo && savedIssue.type) {
      const issueTypeMap = {
        missed_pickup: 'missedPickups',
        damaged_bin: 'damagedBins',
        complaint: 'complaints'
      };
      
      const countField = issueTypeMap[savedIssue.type];
      if (countField) {
        await Company.findByIdAndUpdate(
          savedIssue.assignedTo,
          { $inc: { [`issuesCount.${countField}`]: 1 } }
        );
      }
    }

    return savedIssue;
  } catch (error) {
    console.error('Error in IssueService.createIssue:', error);
    throw error;
  }
}

  async updateIssue(id, updateData) {
    try {
      // Remove assignedTo if it's empty string
      const cleanUpdateData = { ...updateData };
      if (cleanUpdateData.assignedTo === '') {
        delete cleanUpdateData.assignedTo;
      }

      console.log('Cleaned issue data for update:', cleanUpdateData);

      return await Issue.findByIdAndUpdate(
        id,
        cleanUpdateData,
        { new: true, runValidators: true }
      ).populate('assignedTo', 'name contact.email');
    } catch (error) {
      console.error('Error in IssueService.updateIssue:', error);
      throw error;
    }
  }

  async resolveIssue(id, resolutionData) {
    const resolution = {
      ...resolutionData,
      resolvedAt: new Date()
    };

    return await Issue.findByIdAndUpdate(
      id,
      {
        status: 'resolved',
        resolution,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
  }

  async escalateIssue(id, escalationData) {
    const escalation = {
      ...escalationData,
      escalatedAt: new Date()
    };

    return await Issue.findByIdAndUpdate(
      id,
      {
        status: 'escalated',
        escalation,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
  }

  async getIssueStats() {
    const stats = await Issue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          criticalPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] }
          }
        }
      }
    ]);

    const typeStats = await Issue.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      byStatus: stats,
      byType: typeStats
    };
  }
}

module.exports = new IssueService();