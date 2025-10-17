import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const PerformanceModal = ({ company, onClose, onSubmit }) => {
  const [metrics, setMetrics] = useState({
    efficiency: 0,
    compliance: 0,
    collectionRate: 0,
    customerSatisfaction: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(metrics);
  };

  const handleMetricChange = (metric, value) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
    setMetrics(prev => ({
      ...prev,
      [metric]: numValue
    }));
  };

  const getMetricColor = (value) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 80) return 'text-blue-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateOverall = () => {
    return Math.round(
      metrics.efficiency * 0.3 +
      metrics.compliance * 0.3 +
      metrics.collectionRate * 0.2 +
      metrics.customerSatisfaction * 0.2
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Update Performance Metrics
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">
            Updating metrics for: <strong>{company?.name}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'efficiency', label: 'Operational Efficiency', description: 'How efficiently the company operates' },
            { key: 'compliance', label: 'Regulatory Compliance', description: 'Adherence to waste management regulations' },
            { key: 'collectionRate', label: 'Collection Rate', description: 'Percentage of scheduled collections completed' },
            { key: 'customerSatisfaction', label: 'Customer Satisfaction', description: 'Satisfaction ratings from service areas' }
          ].map((metric) => (
            <div key={metric.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {metric.label}
                <span className={`ml-2 font-semibold ${getMetricColor(metrics[metric.key])}`}>
                  {metrics[metric.key]}%
                </span>
              </label>
              <p className="text-xs text-gray-500 mb-2">{metric.description}</p>
              <input
                type="range"
                min="0"
                max="100"
                value={metrics[metric.key]}
                onChange={(e) => handleMetricChange(metric.key, e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          ))}

          <div className="p-3 bg-blue-50 rounded-md">
            <div className="text-sm font-medium text-blue-900">
              Overall Performance Score: <span className={`text-lg ${getMetricColor(calculateOverall())}`}>
                {calculateOverall()}%
              </span>
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Calculated based on weighted metrics (Efficiency 30%, Compliance 30%, Collection 20%, Satisfaction 20%)
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Update Performance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PerformanceModal;