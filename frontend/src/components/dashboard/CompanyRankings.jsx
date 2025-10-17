import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrophyIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

const CompanyRankings = ({ rankings = [] }) => {
  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800';
      case 2:
        return 'bg-gray-100 text-gray-800';
      case 3:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getComplianceIcon = (status) => {
    switch (status) {
      case 'compliant':
        return <ShieldCheckIcon className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'non-compliant':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />;
      case 'suspended':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Company Rankings
          </h3>
          <Link
            to="/companies"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            View all
          </Link>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {rankings.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No ranking data available
          </div>
        ) : (
          rankings.slice(0, 5).map((company) => (
            <div key={company._id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span
                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${getRankColor(
                      company.rank
                    )}`}
                  >
                    {company.rank}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {company.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Score: {Math.round(company.overallScore || 0)}%</span>
                      <div className="flex items-center">
                        {getComplianceIcon(company.complianceStatus)}
                        <span className="ml-1 capitalize">
                          {company.complianceStatus?.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {company.rank <= 3 && (
                  <TrophyIcon className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompanyRankings;