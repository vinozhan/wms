import React from 'react';
import { 
  UserIcon, 
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../common';

const BinRequestCard = ({ 
  request, 
  onApprove, 
  onReject 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <UserIcon className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">{request.requester?.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{request.binType} bin request</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(request.status)}`}>
            {request.status}
          </span>
        </div>

        {/* Request Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start">
            <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
            <div>
              <span className="text-sm text-gray-600">Preferred Location:</span>
              <p className="text-sm font-medium">{request.preferredLocation}</p>
            </div>
          </div>

          <div>
            <span className="text-sm text-gray-600">Justification:</span>
            <p className="text-sm text-gray-900 mt-1">{request.justification}</p>
          </div>

          <div className="flex items-center">
            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Contact:</span>
            <span className="text-sm font-medium ml-2">{request.contactPhone}</span>
          </div>

          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Requested:</span>
            <span className="text-sm font-medium ml-2">{formatDate(request.createdAt)}</span>
          </div>

          {request.additionalNotes && (
            <div>
              <span className="text-sm text-gray-600">Additional Notes:</span>
              <p className="text-sm text-gray-900 mt-1">{request.additionalNotes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {request.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={() => onApprove(request._id)}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 flex items-center justify-center"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Approve
            </button>
            <button 
              onClick={() => onReject(request._id)}
              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 flex items-center justify-center"
            >
              <XCircleIcon className="h-4 w-4 mr-1" />
              Reject
            </button>
          </div>
        )}

        {request.status !== 'pending' && (
          <div className="text-center py-2">
            <span className="text-sm text-gray-500">
              {request.status === 'approved' ? 'Request has been approved' : 'Request has been rejected'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BinRequestCard;