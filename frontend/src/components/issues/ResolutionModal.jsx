import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ResolutionModal = ({ issue, onClose, onSubmit }) => {
  const [resolution, setResolution] = useState({
    actionTaken: '',
    notes: '',
    resolvedBy: 'Municipal Council'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(resolution);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Resolve Issue
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
            Resolving issue: <strong>{issue?.title}</strong>
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Type: {issue?.type?.replace('_', ' ')} • Priority: {issue?.priority}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Action Taken</label>
            <textarea
              rows={4}
              required
              value={resolution.actionTaken}
              onChange={(e) => setResolution({ ...resolution, actionTaken: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the actions taken to resolve this issue..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
            <textarea
              rows={3}
              value={resolution.notes}
              onChange={(e) => setResolution({ ...resolution, notes: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional notes or follow-up required..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Resolved By</label>
            <input
              type="text"
              required
              value={resolution.resolvedBy}
              onChange={(e) => setResolution({ ...resolution, resolvedBy: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Ready to Mark as Resolved
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    This issue will be marked as resolved and moved to the resolved issues list.
                    The assigned company will be notified if applicable.
                  </p>
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
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Mark as Resolved
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolutionModal;