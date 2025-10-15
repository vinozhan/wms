import React from 'react';
import { XMarkIcon, CheckCircleIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Package, MapPin, User, Hash } from 'lucide-react';

const InstallBinModal = ({ isOpen, onClose, onConfirm, request, loading }) => {
  if (!isOpen || !request) return null;

  const handleConfirm = () => {
    onConfirm(request);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <WrenchScrewdriverIcon className="h-6 w-6 mr-2 text-green-600" />
            Install Bin
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>
          
          <h4 className="text-center text-lg font-medium text-gray-900 mb-2">
            Ready to Install Bin?
          </h4>
          
          <p className="text-center text-sm text-gray-600 mb-6">
            This will create the waste bin and add it to the resident's account. 
            The request will be marked as completed.
          </p>

          {/* Request Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{request.requester?.name}</p>
                <p className="text-xs text-gray-500">{request.requester?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Package className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium capitalize">{request.binType}</span> Waste Bin
                </p>
                <p className="text-xs text-gray-500">
                  {request.approvalData?.capacity?.total || request.capacity?.total || 60} {request.approvalData?.capacity?.unit || request.capacity?.unit || 'liters'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-900">
                  {request.approvalData?.location?.address || request.preferredLocation}
                </p>
              </div>
            </div>

            {(request.approvalData?.binId || request.approvalData?.deviceId) && (
              <div className="flex items-center space-x-3">
                <Hash className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">
                    {request.approvalData?.binId && `Bin ID: ${request.approvalData.binId}`}
                    {request.approvalData?.binId && request.approvalData?.deviceId && ' • '}
                    {request.approvalData?.deviceId && `Device ID: ${request.approvalData.deviceId}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm text-white rounded-md flex items-center space-x-2 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Installing...</span>
              </>
            ) : (
              <>
                <WrenchScrewdriverIcon className="h-4 w-4" />
                <span>Install Bin</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBinModal;