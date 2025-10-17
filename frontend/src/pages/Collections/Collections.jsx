import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collectionAPI, wasteBinAPI } from '../../utils/api';
import { 
  TruckIcon, 
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  StopIcon,
  CalendarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { QrCode, Scan, Navigation, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CollectionScanForm, ScheduleCollectionModal, CollectionApprovalModal } from '../../components/Collections';
import { Modal } from '../../components/common';

const Collections = () => {
  const { user } = useAuth();
  const [allCollections, setAllCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScanForm, setShowScanForm] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isCompletingCollection, setIsCompletingCollection] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []); // Only fetch once on component mount

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await collectionAPI.getCollections({}); // Fetch all collections
      setAllCollections(response.data.collections);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'requested': return 'bg-orange-100 text-orange-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'in_progress': return <PlayIcon className="h-4 w-4" />;
      case 'scheduled': return <ClockIcon className="h-4 w-4" />;
      case 'missed': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'cancelled': return <StopIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const startCollection = async (collectionId) => {
    try {
      await collectionAPI.startCollection(collectionId);
      toast.success('Collection started successfully!');
      
      // Always refresh collections to get the latest data
      await fetchCollections();
      
      // If currently viewing scheduled tab, switch to in_progress tab to see the updated collection
      if (filter === 'scheduled') {
        setFilter('in_progress');
      }
    } catch (error) {
      console.error('Start collection error:', error);
      toast.error(error.response?.data?.error || 'Failed to start collection');
    }
  };

  // Filter collections based on current filter
  const filteredCollections = filter === 'all' 
    ? allCollections 
    : allCollections.filter(collection => collection.status === filter);

  const openScanForm = async (collection) => {
    try {
      // Fetch fresh bin data to get updated capacity
      const freshBinResponse = await wasteBinAPI.getWasteBin(collection.wasteBin._id);
      const updatedCollection = {
        ...collection,
        wasteBin: freshBinResponse.data.wasteBin
      };
      
      setSelectedCollection(updatedCollection);
      setShowScanForm(true);
    } catch (error) {
      console.error('Failed to fetch fresh bin data:', error);
      // Fallback to using existing collection data
      setSelectedCollection(collection);
      setShowScanForm(true);
    }
  };

  const completeCollection = async (data) => {
    if (isCompletingCollection) return; // Prevent double submission
    
    try {
      setIsCompletingCollection(true);
      await collectionAPI.completeCollection(selectedCollection._id, data);
      toast.success('Collection completed and bill generated!');
      setShowScanForm(false);
      setSelectedCollection(null);
      await fetchCollections();
    } catch (error) {
      console.error('Failed to complete collection:', error);
      toast.error('Failed to complete collection');
      throw error;
    } finally {
      setIsCompletingCollection(false);
    }
  };

  const markMissed = async (collectionId, reason) => {
    try {
      await collectionAPI.markCollectionMissed(collectionId, reason);
      toast.success('Collection marked as missed');
      fetchCollections();
    } catch (error) {
      toast.error('Failed to mark collection as missed');
    }
  };

  const approveCollection = async (collection) => {
    setSelectedCollection(collection);
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async (approvalData) => {
    try {
      await collectionAPI.approveCollection(selectedCollection._id, approvalData);
      toast.success('Collection request approved and scheduled');
      setShowApprovalModal(false);
      setSelectedCollection(null);
      fetchCollections();
    } catch (error) {
      console.error('Failed to approve collection:', error);
      toast.error('Failed to approve collection');
    }
  };

  const rejectCollection = async (collection) => {
    try {
      const reason = prompt('Please provide a reason for rejection:');
      if (reason !== null) {
        await collectionAPI.rejectCollection(collection._id, reason);
        toast.success('Collection request rejected');
        fetchCollections();
      }
    } catch (error) {
      console.error('Failed to reject collection:', error);
      toast.error('Failed to reject collection');
    }
  };

  const todaysCollections = allCollections.filter(collection => {
    const today = new Date().toDateString();
    const scheduledDate = new Date(collection.scheduledDate).toDateString();
    return today === scheduledDate;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-600">
            {user.userType === 'collector' ? 'Manage your collection routes' : 'Monitor all collections'}
          </p>
        </div>
        {user.userType === 'admin' && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Schedule Collection</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Collections</dt>
                  <dd className="text-lg font-medium text-gray-900">{todaysCollections.length}</dd>
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
                    {allCollections.filter(c => c.status === 'completed').length}
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
                <PlayIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {allCollections.filter(c => c.status === 'in_progress').length}
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
                <CalendarIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Requested</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {allCollections.filter(c => c.status === 'requested').length}
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
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Missed</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {allCollections.filter(c => c.status === 'missed').length}
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
          {['all', 'requested', 'scheduled', 'in_progress', 'completed', 'missed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                filter === status
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {status === 'all' ? 'All Collections' : status.replace('_', ' ')}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {status === 'all' ? allCollections.length : allCollections.filter(c => c.status === status).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Collections List */}
      {filteredCollections.length === 0 ? (
        <div className="text-center py-12">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No collections found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' ? 'No collection records available.' : `No ${filter} collections found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCollections.map((collection) => (
            <CollectionCard
              key={collection._id}
              collection={collection}
              userType={user.userType}
              onStart={() => startCollection(collection._id)}
              onComplete={(collection) => openScanForm(collection)}
              onMarkMissed={(reason) => markMissed(collection._id, reason)}
              onApprove={(collection) => approveCollection(collection)}
              onReject={(collection) => rejectCollection(collection)}
            />
          ))}
        </div>
      )}

      {/* Schedule Collection Modal */}
      {showScheduleModal && (
        <ScheduleCollectionModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSubmit={async (data) => {
            try {
              await collectionAPI.createCollection(data);
              toast.success('Collection scheduled successfully!');
              setShowScheduleModal(false);
              fetchCollections();
            } catch (error) {
              console.error('Failed to schedule collection:', error);
              toast.error('Failed to schedule collection');
            }
          }}
        />
      )}

      {/* Collection Scan Form Modal */}
      <Modal
        isOpen={showScanForm}
        onClose={() => {
          setShowScanForm(false);
          setSelectedCollection(null);
        }}
        title="Complete Collection & Generate Bill"
        size="lg"
      >
        {selectedCollection && (
          <CollectionScanForm
            collection={selectedCollection}
            onComplete={completeCollection}
            onCancel={() => {
              setShowScanForm(false);
              setSelectedCollection(null);
            }}
          />
        )}
      </Modal>

      {/* Collection Approval Modal */}
      {showApprovalModal && selectedCollection && (
        <CollectionApprovalModal
          collection={selectedCollection}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedCollection(null);
          }}
          onApprove={handleApprovalSubmit}
        />
      )}
    </div>
  );
};

// Collection Card Component
const CollectionCard = ({ collection, userType, onStart, onComplete, onMarkMissed, onApprove, onReject }) => {
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showMissedModal, setShowMissedModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'missed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'in_progress': return <PlayIcon className="h-4 w-4" />;
      case 'scheduled': return <ClockIcon className="h-4 w-4" />;
      case 'missed': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <TruckIcon className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Collection #{collection.collectionId}
              </h3>
              <p className="text-sm text-gray-500">
                Bin: {collection.wasteBin?.binId} ({collection.wasteData?.wasteType})
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(collection.status)}`}>
            {getStatusIcon(collection.status)}
            <span className="ml-1 capitalize">{collection.status.replace('_', ' ')}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Schedule</h4>
            <div className="text-sm">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span>{new Date(collection.scheduledDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center mt-1">
                <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span>{new Date(collection.scheduledDate).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Location</h4>
            <div className="text-sm">
              <div className="flex items-start">
                <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                <span className="text-gray-600">{collection.wasteBin?.location?.address}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Collector</h4>
            <div className="text-sm">
              <span className="text-gray-900">{collection.collector?.name}</span>
            </div>
          </div>
        </div>

        {collection.status === 'completed' && (
          <div className="mb-4 p-3 bg-green-50 rounded">
            <h4 className="text-sm font-medium text-green-800 mb-2">Collection Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600">Weight: </span>
                <span>{collection.wasteData?.weight || 0} kg</span>
              </div>
              <div>
                <span className="text-green-600">Volume: </span>
                <span>{collection.wasteData?.volume || 0} L</span>
              </div>
            </div>
          </div>
        )}

        {/* Admin Actions for Requested Collections */}
        {userType === 'admin' && collection.status === 'requested' && (
          <div className="flex space-x-3">
            <button
              onClick={() => onApprove && onApprove(collection)}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Approve & Schedule</span>
            </button>
            <button
              onClick={() => onReject && onReject(collection)}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center space-x-2"
            >
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Reject</span>
            </button>
          </div>
        )}

        {/* Collector Actions */}
        {userType === 'collector' && (
          <div className="flex space-x-3">
            {collection.status === 'scheduled' && (
              <button
                onClick={async () => {
                  setIsStarting(true);
                  try {
                    await onStart();
                  } finally {
                    setIsStarting(false);
                  }
                }}
                disabled={isStarting}
                className={`flex-1 px-4 py-2 rounded-md flex items-center justify-center space-x-2 ${
                  isStarting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                <PlayIcon className="h-4 w-4" />
                <span>{isStarting ? 'Starting...' : 'Start Collection'}</span>
              </button>
            )}
            
            {collection.status === 'in_progress' && (
              <>
                <button
                  onClick={() => onComplete(collection)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <Scan className="h-4 w-4" />
                  <span>Scan & Complete</span>
                </button>
                <button
                  onClick={() => setShowMissedModal(true)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center space-x-2"
                >
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>Mark Missed</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>


      {/* Mark Missed Modal */}
      {showMissedModal && (
        <MarkMissedModal
          isOpen={showMissedModal}
          onClose={() => setShowMissedModal(false)}
          onSubmit={(reason) => {
            onMarkMissed(reason);
            setShowMissedModal(false);
          }}
        />
      )}
    </div>
  );
};

// Complete Collection Modal
const CompleteCollectionModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    weight: '',
    volume: '',
    verification: {
      method: 'rfid_scan'
    },
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      weight: parseFloat(formData.weight),
      volume: parseFloat(formData.volume),
      verification: formData.verification,
      notes: formData.notes
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Collection</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Volume (L)</label>
              <input
                type="number"
                step="0.1"
                value={formData.volume}
                onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Verification Method</label>
            <select
              value={formData.verification.method}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                verification: { ...prev.verification, method: e.target.value }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="rfid_scan">RFID Scan</option>
              <option value="qr_scan">QR Code Scan</option>
              <option value="barcode_scan">Barcode Scan</option>
              <option value="manual_entry">Manual Entry</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows="3"
              placeholder="Any additional notes..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Complete Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Mark Missed Modal
const MarkMissedModal = ({ isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(reason);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mark Collection as Missed</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows="4"
              placeholder="Reason for missing the collection..."
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Mark as Missed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Collections;