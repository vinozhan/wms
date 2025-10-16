// Temporary mock service until real services are implemented
class MockService {
  static async getAllCompanies(filters = {}) {
    return {
      companies: [
        {
          _id: '1',
          name: 'Green Waste Solutions',
          registrationNumber: 'GWS001',
          complianceStatus: 'compliant',
          rating: 4,
          issuesCount: { missedPickups: 2, damagedBins: 1, complaints: 3 },
          contact: { email: 'contact@greenwaste.com', phone: '+1234567890' }
        }
      ],
      totalPages: 1,
      currentPage: 1,
      total: 1
    };
  }

  static async getCompanyRankings() {
    return [
      {
        _id: '1',
        name: 'Green Waste Solutions',
        overallScore: 85,
        rank: 1,
        complianceStatus: 'compliant'
      }
    ];
  }

  static async getAllIssues(filters = {}) {
    return {
      issues: [
        {
          _id: '1',
          title: 'Missed collection in Downtown area',
          type: 'missed_pickup',
          priority: 'high',
          status: 'reported',
          reportedBy: 'Resident',
          createdAt: new Date()
        }
      ],
      totalPages: 1,
      currentPage: 1,
      total: 1
    };
  }

  static async getAllPrograms(filters = {}) {
    return {
      programs: [
        {
          _id: '1',
          name: 'Recycling Initiative',
          type: 'recycling',
          status: 'active',
          progress: 75
        }
      ],
      totalPages: 1,
      currentPage: 1,
      total: 1
    };
  }
}

module.exports = MockService;