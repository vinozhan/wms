const mongoose = require('mongoose');
const CompanyService = require('../services/CompanyService');
const Company = require('../models/Company');

describe('CompanyService', () => {
  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Company.deleteMany({});
  });

  describe('createCompany', () => {
    it('should create a new company successfully', async () => {
      const companyData = {
        name: 'Test Waste Co',
        registrationNumber: 'TEST123',
        contact: {
          email: 'test@wasteco.com',
          phone: '+1234567890'
        }
      };

      const company = await CompanyService.createCompany(companyData);

      expect(company).toBeDefined();
      expect(company.name).toBe(companyData.name);
      expect(company.registrationNumber).toBe(companyData.registrationNumber);
      expect(company.contact.email).toBe(companyData.contact.email);
    });

    it('should throw error for duplicate registration number', async () => {
      const companyData = {
        name: 'Test Waste Co',
        registrationNumber: 'TEST123',
        contact: {
          email: 'test@wasteco.com',
          phone: '+1234567890'
        }
      };

      await CompanyService.createCompany(companyData);

      await expect(CompanyService.createCompany(companyData))
        .rejects
        .toThrow();
    });
  });

  describe('getCompanyRankings', () => {
    it('should return companies sorted by overall score', async () => {
      const companies = [
        {
          name: 'Company A',
          registrationNumber: 'COMPA',
          performanceMetrics: [{
            efficiency: 90,
            compliance: 85,
            collectionRate: 88,
            customerSatisfaction: 92
          }]
        },
        {
          name: 'Company B',
          registrationNumber: 'COMPB',
          performanceMetrics: [{
            efficiency: 80,
            compliance: 75,
            collectionRate: 82,
            customerSatisfaction: 78
          }]
        }
      ];

      await Company.insertMany(companies);
      const rankings = await CompanyService.getCompanyRankings();

      expect(rankings).toHaveLength(2);
      expect(rankings[0].name).toBe('Company A');
      expect(rankings[0].rank).toBe(1);
      expect(rankings[1].rank).toBe(2);
    });
  });

  describe('enforceCompliance', () => {
    it('should update company compliance status for valid action', async () => {
      const company = await Company.create({
        name: 'Test Company',
        registrationNumber: 'TEST123',
        contact: { email: 'test@test.com', phone: '1234567890' }
      });

      const updated = await CompanyService.enforceCompliance(company._id, 'warning');

      expect(updated.complianceStatus).toBe('warning');
    });

    it('should throw error for invalid compliance action', async () => {
      const company = await Company.create({
        name: 'Test Company',
        registrationNumber: 'TEST123',
        contact: { email: 'test@test.com', phone: '1234567890' }
      });

      await expect(CompanyService.enforceCompliance(company._id, 'invalid_action'))
        .rejects
        .toThrow('Invalid compliance action');
    });
  });
});