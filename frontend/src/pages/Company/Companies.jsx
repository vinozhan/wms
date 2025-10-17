import React, { useState, useEffect } from 'react';
import { companyService } from '../../utils/api';
import CompanyTable from '../../components/companies/CompanyTable';
import CompanyModal from '../../components/companies/CompanyModal';
import ComplianceModal from '../../components/companies/ComplianceModal';
import PerformanceModal from '../../components/companies/PerformanceModal';
import { PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    complianceStatus: ''
  });

  const fetchCompanies = async () => {
  try {
    setLoading(true);
    const response = await companyService.getAll(filters);
    console.log('Companies API Response:', response); // Debug log
    
    // Make sure we're setting the companies array correctly
    if (response && response.data) {
      setCompanies(response.data);
    } else {
      console.error('Unexpected API response format:', response);
      setCompanies({ companies: [], totalPages: 0, currentPage: 1, total: 0 });
    }
  } catch (err) {
    console.error('Error fetching companies:', err);
    setError(err.message);
    // Set empty state on error
    setCompanies({ companies: [], totalPages: 0, currentPage: 1, total: 0 });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchCompanies();
  }, [filters]);

  const handleCreateCompany = async (companyData) => {
  try {
    console.log('Creating company:', companyData);
    const response = await companyService.create(companyData);
    console.log('Create company response:', response); // Debug log
    
    // Close modal first
    setShowModal(false);
    
    // Small delay to ensure backend has processed the creation
    setTimeout(() => {
      fetchCompanies();
    }, 500);
    
    // Also force refresh after 2 seconds as backup
    setTimeout(() => {
      fetchCompanies();
    }, 2000);
    
  } catch (err) {
    console.error('Error creating company:', err);
    setError(err.message);
  }
};

const handleUpdateCompany = async (id, companyData) => {
  try {
    console.log('Updating company:', id, companyData); // Debug log
    await companyService.update(id, companyData);
    await fetchCompanies();
    setShowModal(false);
    setSelectedCompany(null);
  } catch (err) {
    console.error('Error updating company:', err);
    setError(err.message);
  }
};

  const handleEnforceCompliance = async (action) => {
    try {
      await companyService.enforceCompliance(selectedCompany._id, action);
      await fetchCompanies();
      setShowComplianceModal(false);
      setSelectedCompany(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdatePerformance = async (metrics) => {
    try {
      await companyService.updatePerformance(selectedCompany._id, metrics);
      await fetchCompanies();
      setShowPerformanceModal(false);
      setSelectedCompany(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setShowModal(true);
  };

  const handleCompliance = (company) => {
    setSelectedCompany(company);
    setShowComplianceModal(true);
  };

  const handlePerformance = (company) => {
    setSelectedCompany(company);
    setShowPerformanceModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Waste Management Companies</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Company
          </button>
          <button
            onClick={() => fetchCompanies()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search companies..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Compliance Status</label>
            <select
              value={filters.complianceStatus}
              onChange={(e) => setFilters({ ...filters, complianceStatus: e.target.value, page: 1 })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="compliant">Compliant</option>
              <option value="warning">Warning</option>
              <option value="non-compliant">Non-Compliant</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      <CompanyTable
        companies={companies}
        loading={loading}
        onEdit={handleEdit}
        onCompliance={handleCompliance}
        onPerformance={handlePerformance}
      />

      {/* Modals */}
      {showModal && (
        <CompanyModal
          company={selectedCompany}
          onClose={() => {
            setShowModal(false);
            setSelectedCompany(null);
          }}
          onSubmit={selectedCompany ? handleUpdateCompany : handleCreateCompany}
        />
      )}

      {showComplianceModal && selectedCompany && (
        <ComplianceModal
          company={selectedCompany}
          onClose={() => {
            setShowComplianceModal(false);
            setSelectedCompany(null);
          }}
          onSubmit={handleEnforceCompliance}
        />
      )}

      {showPerformanceModal && selectedCompany && (
        <PerformanceModal
          company={selectedCompany}
          onClose={() => {
            setShowPerformanceModal(false);
            setSelectedCompany(null);
          }}
          onSubmit={handleUpdatePerformance}
        />
      )}
    </div>
  );
};

export default Companies;