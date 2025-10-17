import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, change }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      changeBg: 'bg-blue-100'
    },
    green: {
      bg: 'bg-green-500',
      text: 'text-green-600',
      changeBg: 'bg-green-100'
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-600',
      changeBg: 'bg-red-100'
    },
    purple: {
      bg: 'bg-purple-500',
      text: 'text-purple-600',
      changeBg: 'bg-purple-100'
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600',
      changeBg: 'bg-yellow-100'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div 
              className={`${colors.bg} rounded-md p-3`}
              data-testid="stat-card-icon"
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-semibold text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {change && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className={`${colors.text} ${colors.changeBg} px-2 py-1 rounded-full text-xs font-medium`}>
              {change}
            </span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;