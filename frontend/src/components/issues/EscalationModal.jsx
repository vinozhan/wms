import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const EscalationModal = ({ issue, onClose, onSubmit }) => {
  const [escalation, setEscalation] = useState({
    escalatedTo: '',
    reason: '',
    escalatedBy: 'Municipal Council'
  });

  const escalationOptions = [
    'Regional Waste Management Authority',
    'Environmental Protection Agency',
    'City Council Committee',
    'Legal Department',
    'Senior Management',
    'External Auditor'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(escalation);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Escalate Issue
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-yellow-50 rounded-md">
          <p className="text-sm text-yellow-700">
            Escalating issue: <strong>{issue?.title}</strong>
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            This action should be used for issues requiring higher authority attention.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Escalate To</label>
            <select
              required
              value={escalation.escalatedTo}
              onChange={(e) => setEscalation({ ...escalation, escalatedTo: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select authority...</option>
              {escalationOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason for Escalation</label>
            <textarea
              rows={4}
              required
              value={escalation.reason}
              onChange={(e) => setEscalation({ ...escalation, reason: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explain why this issue requires escalation, including any compliance concerns or public impact..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Escalated By</label>
            <input
              type="text"
              required
              value={escalation.escalatedBy}
              onChange={(e) => setEscalation({ ...escalation, escalatedBy: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  Important: Escalation Impact
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Issue will be marked as escalated</li>
                    <li>Higher authority will be notified</li>
                    <li>Regular resolution workflow will be paused</li>
                    <li>This action will be logged in the audit trail</li>
                  </ul>
                </div>
              </div>
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
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
            >
              Escalate Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EscalationModal;