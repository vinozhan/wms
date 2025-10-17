import React from 'react';
import { 
  PencilIcon, 
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

const ProgramTable = ({ programs, loading, onEdit, onApprove }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      pending_approval: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      active: { color: 'bg-blue-100 text-blue-800', label: 'Active' },
      completed: { color: 'bg-purple-100 text-purple-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      recycling: { color: 'bg-green-100 text-green-800', label: 'Recycling' },
      composting: { color: 'bg-brown-100 text-brown-800', label: 'Composting' },
      hazardous_waste: { color: 'bg-red-100 text-red-800', label: 'Hazardous Waste' },
      bulk_collection: { color: 'bg-blue-100 text-blue-800', label: 'Bulk Collection' },
      special: { color: 'bg-purple-100 text-purple-800', label: 'Special' }
    };

    const config = typeConfig[type] || typeConfig.special;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const calculateProgress = (program) => {
    if (!program.timeline?.milestones?.length) return 0;
    const completed = program.timeline.milestones.filter(m => m.completed).length;
    return Math.round((completed / program.timeline.milestones.length) * 100);
  };

  if (loading) {
    return <LoadingSpinner text="Loading programs..." />;
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timeline
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {programs.programs && programs.programs.length > 0 ? (
              programs.programs.map((program) => (
                <tr key={program._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {program.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {program.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(program.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(program.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${calculateProgress(program)}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-500">{calculateProgress(program)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Allocated: ${program.budget?.allocated?.toLocaleString()}</div>
                    <div>Utilized: ${program.budget?.utilized?.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Start: {program.timeline?.startDate ? new Date(program.timeline.startDate).toLocaleDateString() : 'N/A'}</div>
                    <div>End: {program.timeline?.endDate ? new Date(program.timeline.endDate).toLocaleDateString() : 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(program)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Program"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {program.status === 'pending_approval' && (
                        <button
                          onClick={() => onApprove(program)}
                          className="text-green-600 hover:text-green-900"
                          title="Approve Program"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No programs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgramTable;