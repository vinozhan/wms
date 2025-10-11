import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { binRequestAPI, wasteBinAPI } from '../../utils/api';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

const BinRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('approve');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await binRequestAPI.getBinRequests(params);
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Failed to fetch bin requests:', error);
      toast.error('Failed to load bin requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, action, data) => {
    try {
      if (action === 'approve') {
        await binRequestAPI.approveBinRequest(requestId, data);
        toast.success('Bin request approved successfully');
      } else {
        await binRequestAPI.rejectBinRequest(requestId, data);
        toast.success('Bin request rejected');
      }
      fetchRequests();
    } catch (error) {
      console.error('Failed to review request:', error);
      toast.error(`Failed to ${action} request`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'approved': return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected': return <XCircleIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bin Requests</h1>
          <p className="text-gray-600">
            {user?.userType === 'admin' ? 'Review and manage bin requests from residents and businesses' : 'Your bin requests'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {requests.filter(r => r.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {requests.filter(r => r.status === 'approved').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {requests.filter(r => r.status === 'completed').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {requests.filter(r => r.status === 'rejected').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['all', 'pending', 'approved', 'completed', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                filter === status
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {status === 'all' ? 'All Requests' : status}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {status === 'all' ? requests.length : requests.filter(r => r.status === status).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' ? 'No bin requests available.' : `No ${filter} requests found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard
              key={request._id}
              request={request}
              userType={user?.userType}
              onViewDetails={(req) => {
                setSelectedRequest(req);
                setShowDetailModal(true);
              }}
              onReview={(req, action) => {
                setSelectedRequest(req);
                setReviewAction(action);
                setShowReviewModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRequest(null);
          }}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          action={reviewAction}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedRequest(null);
          }}
          onSubmit={(data) => {
            handleReview(selectedRequest._id, reviewAction, data);
            setShowReviewModal(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
};

// Request Card Component
const RequestCard = ({ request, userType, onViewDetails, onReview }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'approved': return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected': return <XCircleIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Request #{request.requestId}
              </h3>
              <p className="text-sm text-gray-500">
                {request.requester?.name} ({request.requester?.userType})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
              {request.priority} priority
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {getStatusIcon(request.status)}
              <span className="ml-1 capitalize">{request.status}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Bin Type</h4>
            <p className="text-sm capitalize">{request.binType}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Request Date</h4>
            <p className="text-sm">{new Date(request.requestDate).toLocaleDateString()}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Contact</h4>
            <p className="text-sm">{request.contactPhone}</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Preferred Location</h4>
          <p className="text-sm text-gray-600">{request.preferredLocation}</p>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            onClick={() => onViewDetails(request)}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View Details
          </button>

          {userType === 'admin' && request.status === 'pending' && (
            <div className="flex space-x-2">
              <button
                onClick={() => onReview(request, 'approve')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => onReview(request, 'reject')}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Request Detail Modal
const RequestDetailModal = ({ request, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Request #{request.requestId} Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Requester Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{request.requester?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm ml-2">{request.requester?.email}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{request.contactPhone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{request.requester?.address?.street}, {request.requester?.address?.city}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Request Details</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Bin Type:</span>
                    <span className="text-sm ml-2 capitalize">{request.binType}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Priority:</span>
                    <span className="text-sm ml-2 capitalize">{request.priority}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm ml-2 capitalize">{request.status}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Request Date:</span>
                    <span className="text-sm ml-2">{new Date(request.requestDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preferred Location</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{request.preferredLocation}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Justification</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{request.justification}</p>
            </div>

            {request.additionalNotes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{request.additionalNotes}</p>
              </div>
            )}

            {request.reviewNotes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Review Notes</h4>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">{request.reviewNotes}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Reviewed by {request.reviewedBy?.name} on {new Date(request.reviewDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Review Modal
const ReviewModal = ({ request, action, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    reviewNotes: '',
    priority: request.priority
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {action === 'approve' ? 'Approve Request' : 'Reject Request'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {action === 'approve' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {action === 'approve' ? 'Notes (Optional)' : 'Rejection Reason'}
              </label>
              <textarea
                value={formData.reviewNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewNotes: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows="4"
                placeholder={action === 'approve' ? 'Any additional notes...' : 'Please provide a reason for rejection...'}
                required={action === 'reject'}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm text-white rounded-md ${
                  action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BinRequests;