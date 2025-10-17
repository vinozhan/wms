import React from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

const StatusBadge = ({ status, fillLevel, priority, type = 'bin' }) => {
  const getStatusConfig = () => {
    if (type === 'bin') {
      if (status === 'full' || fillLevel >= 80) {
        return {
          color: 'bg-red-100 text-red-800',
          icon: <ExclamationTriangleIcon className="h-4 w-4" />,
          text: fillLevel >= 80 ? `${fillLevel}% Full` : 'Full'
        };
      }
      if (status === 'maintenance') {
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <ClockIcon className="h-4 w-4" />,
          text: 'Maintenance'
        };
      }
      if (fillLevel >= 60) {
        return {
          color: 'bg-orange-100 text-orange-800',
          icon: <CheckCircleIcon className="h-4 w-4" />,
          text: `${fillLevel}% Full`
        };
      }
      return {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircleIcon className="h-4 w-4" />,
        text: status === 'active' ? 'Active' : 'Normal'
      };
    }

    if (type === 'priority') {
      const priorityConfigs = {
        urgent: { color: 'bg-red-100 text-red-800', icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
        high: { color: 'bg-orange-100 text-orange-800', icon: <ClockIcon className="h-4 w-4" /> },
        medium: { color: 'bg-yellow-100 text-yellow-800', icon: <ClockIcon className="h-4 w-4" /> },
        low: { color: 'bg-green-100 text-green-800', icon: <CheckCircleIcon className="h-4 w-4" /> }
      };
      return {
        ...priorityConfigs[priority] || priorityConfigs.medium,
        text: priority
      };
    }

    if (type === 'request') {
      const statusConfigs = {
        pending: { color: 'bg-yellow-100 text-yellow-800', icon: <ClockIcon className="h-4 w-4" /> },
        approved: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircleIcon className="h-4 w-4" /> },
        rejected: { color: 'bg-red-100 text-red-800', icon: <XCircleIcon className="h-4 w-4" /> },
        completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircleIcon className="h-4 w-4" /> }
      };
      return {
        ...statusConfigs[status] || statusConfigs.pending,
        text: status
      };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      <span className="ml-1 capitalize">{config.text}</span>
    </span>
  );
};

export default StatusBadge;