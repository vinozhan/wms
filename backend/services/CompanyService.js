const Company = require('../models/Company');

class CompanyService {
  async getAllCompanies(filters = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      complianceStatus,
      search
    } = filters;

    const query = {};
    
    if (complianceStatus) {
      query.complianceStatus = complianceStatus;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Company query:', query); // Debug log

    const companies = await Company.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Company.countDocuments(query);

    console.log(`Found ${companies.length} companies out of ${total}`); // Debug log

    return {
      companies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    };
  }  catch (error) {
      console.error('Error in CompanyService.getAllCompanies:', error);
      throw error;
    }

  async getCompanyById(id) {
    return await Company.findById(id);
  }

  async createCompany(companyData) {
    const company = new Company(companyData);
    return await company.save();
  }

  async updateCompany(id, updateData) {
    return await Company.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async deleteCompany(id) {
    return await Company.findByIdAndDelete(id);
  }

  async updateCompanyPerformance(companyId, metrics) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    return await company.updatePerformance(metrics);
  }

  async getCompanyRankings() {
    const companies = await Company.aggregate([
      {
        $addFields: {
          latestMetrics: { $arrayElemAt: ['$performanceMetrics', -1] }
        }
      },
      {
        $addFields: {
          overallScore: {
            $cond: {
              if: { $isArray: '$performanceMetrics' },
              then: {
                $add: [
                  { $multiply: [{ $ifNull: ['$latestMetrics.efficiency', 0] }, 0.3] },
                  { $multiply: [{ $ifNull: ['$latestMetrics.compliance', 0] }, 0.3] },
                  { $multiply: [{ $ifNull: ['$latestMetrics.collectionRate', 0] }, 0.2] },
                  { $multiply: [{ $ifNull: ['$latestMetrics.customerSatisfaction', 0] }, 0.2] }
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $sort: { overallScore: -1 }
      },
      {
        $project: {
          name: 1,
          registrationNumber: 1,
          complianceStatus: 1,
          overallScore: 1,
          rating: 1,
          issuesCount: 1,
          'contact.email': 1
        }
      }
    ]);

    return companies.map((company, index) => ({
      ...company,
      rank: index + 1
    }));
  }

  async enforceCompliance(companyId, action) {
    const validActions = ['warning', 'fine', 'suspension'];
    if (!validActions.includes(action)) {
      throw new Error('Invalid compliance action');
    }

    let newStatus;
    switch (action) {
      case 'warning':
        newStatus = 'warning';
        break;
      case 'fine':
        newStatus = 'non-compliant';
        break;
      case 'suspension':
        newStatus = 'suspended';
        break;
    }

    return await this.updateCompany(companyId, { complianceStatus: newStatus });
  }
}

module.exports = new CompanyService();