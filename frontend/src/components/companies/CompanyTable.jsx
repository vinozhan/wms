import React from 'react';
import { 
  PencilIcon, 
  ShieldExclamationIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

const CompanyTable = ({ companies, loading, onEdit, onCompliance, onPerformance }) => {
  // Handle both flat and nested structures
  let companiesList = [];
  let total = 0;
  let currentPage = 1;
  let totalPages = 0;

  if (companies) {
    // If companies has a companies property (nested structure)
    if (companies.companies && Array.isArray(companies.companies)) {
      companiesList = companies.companies;
      total = companies.total || 0;
      currentPage = companies.currentPage || 1;
      totalPages = companies.totalPages || 0;
    } 
    // If companies is directly the array (flat structure)
    else if (Array.isArray(companies)) {
      companiesList = companies;
    }
    // If it's the API response with data nested
    else if (companies.data && companies.data.companies) {
      companiesList = companies.data.companies;
      total = companies.data.total || 0;
      currentPage = companies.data.currentPage || 1;
      totalPages = companies.data.totalPages || 0;
    }
  }

  console.log('CompanyTable processed:', { 
    original: companies, 
    companiesList, 
    total, 
    currentPage, 
    totalPages 
  });

  // ... rest of the component remains the same
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Compliance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issues
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {companiesList.length > 0 ? (
              companiesList.map((company) => (
                <tr key={company._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {company.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {company.registrationNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.complianceStatus === 'compliant' ? 'bg-green-100 text-green-800' :
                      company.complianceStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      company.complianceStatus === 'non-compliant' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {company.complianceStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-4 w-4 ${star <= (company.rating || 3) ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div>Missed: {company.issuesCount?.missedPickups || 0}</div>
                      <div>Damaged: {company.issuesCount?.damagedBins || 0}</div>
                      <div>Complaints: {company.issuesCount?.complaints || 0}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{company.contact?.email}</div>
                    <div>{company.contact?.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(company)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Company"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onPerformance(company)}
                        className="text-green-600 hover:text-green-900"
                        title="Update Performance"
                      >
                        <ChartBarIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onCompliance(company)}
                        className="text-red-600 hover:text-red-900"
                        title="Enforce Compliance"
                      >
                        <ShieldExclamationIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {loading ? 'Loading companies...' : 'No companies found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyTable;