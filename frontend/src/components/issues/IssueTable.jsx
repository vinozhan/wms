import React from 'react';
import { 
  PencilIcon, 
  CheckCircleIcon,
  ArrowUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

const IssueTable = ({ issues, loading, onEdit, onResolve, onEscalate }) => {
    // Add debug log to see what data we're receiving
  console.log('📦 [IssueTable] Received issues prop:', issues);
  console.log('👀 [IssueTable] issues.issues value:', issues?.issues);
  console.log('🔢 [IssueTable] Number of issues:', issues?.issues?.length);
  
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      critical: { color: 'bg-red-100 text-red-800', label: 'Critical' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      low: { color: 'bg-blue-100 text-blue-800', label: 'Low' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      reported: { color: 'bg-gray-100 text-gray-800', label: 'Reported' },
      in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
      escalated: { color: 'bg-purple-100 text-purple-800', label: 'Escalated' },
      closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed' }
    };

    const config = statusConfig[status] || statusConfig.reported;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatIssueType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return <LoadingSpinner text="Loading issues..." />;
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reported
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {issues.issues && issues.issues.length > 0 ? (
              issues.issues.map((issue) => (
                <tr key={issue._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {issue.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {issue.description.substring(0, 100)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatIssueType(issue.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPriorityBadge(issue.priority)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(issue.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{new Date(issue.createdAt).toLocaleDateString()}</div>
                    <div className="text-gray-400">by {issue.reportedBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {issue.assignedTo?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(issue)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Issue"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {issue.status !== 'resolved' && (
                        <button
                          onClick={() => onResolve(issue)}
                          className="text-green-600 hover:text-green-900"
                          title="Resolve Issue"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                      {issue.status !== 'escalated' && (
                        <button
                          onClick={() => onEscalate(issue)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Escalate Issue"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No issues found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IssueTable;