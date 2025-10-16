import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ApprovalModal = ({ program, onClose, onSubmit }) => {
  const [approvalData, setApprovalData] = useState({
    approvedBy: 'Municipal Council',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(approvalData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Approve Program
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-green-50 rounded-md">
          <p className="text-sm text-green-700">
            Approving program: <strong>{program?.name}</strong>
          </p>
          <p className="text-sm text-green-600 mt-1">
            Type: {program?.type} • Budget: ${program?.budget?.allocated?.toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Approved By</label>
            <input
              type="text"
              required
              value={approvalData.approvedBy}
              onChange={(e) => setApprovalData({ ...approvalData, approvedBy: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter approver name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Approval Notes</label>
            <textarea
              rows={4}
              value={approvalData.notes}
              onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any approval conditions, comments, or special instructions..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Program Approval
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Upon approval, this program will be marked as "Approved" and can be
                    activated for implementation. Budget allocation will be confirmed
                    and stakeholders will be notified.
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
              Approve Program
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApprovalModal;