import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ComplianceModal = ({ company, onClose, onSubmit }) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [notes, setNotes] = useState('');

  const complianceActions = [
    {
      value: 'warning',
      label: 'Issue Warning',
      description: 'Formal warning for minor compliance issues',
      severity: 'medium'
    },
    {
      value: 'fine',
      label: 'Impose Fine',
      description: 'Financial penalty for repeated violations',
      severity: 'high'
    },
    {
      value: 'suspension',
      label: 'Suspend Operations',
      description: 'Temporary suspension for serious violations',
      severity: 'critical'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedAction) {
      onSubmit(selectedAction, notes);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Enforce Compliance
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            Taking action against: <strong>{company?.name}</strong>
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Current status: <span className="capitalize">{company?.complianceStatus}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Compliance Action
            </label>
            <div className="space-y-2">
              {complianceActions.map((action) => (
                <div
                  key={action.value}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    selectedAction === action.value
                      ? getSeverityColor(action.severity)
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedAction(action.value)}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="complianceAction"
                      value={action.value}
                      checked={selectedAction === action.value}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{action.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{action.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Additional Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide details about the compliance issue and action taken..."
            />
          </div>

          {selectedAction && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Compliance Action Required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You are about to {selectedAction} for {company?.name}. This action will
                      update their compliance status and may affect their operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              disabled={!selectedAction}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Enforce Compliance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplianceModal;