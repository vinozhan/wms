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

const Collections = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, [filter]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await collectionAPI.getCollections(params);
      setCollections(response.data.collections);
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
      fetchCollections();
    } catch (error) {
      toast.error('Failed to start collection');
    }
  };

  const completeCollection = async (collectionId, data) => {
    try {
      await collectionAPI.completeCollection(collectionId, data);
      toast.success('Collection completed successfully!');
      fetchCollections();
    } catch (error) {
      toast.error('Failed to complete collection');
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

  const todaysCollections = collections.filter(collection => {
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
                    {collections.filter(c => c.status === 'completed').length}
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
                    {collections.filter(c => c.status === 'in_progress').length}
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
                    {collections.filter(c => c.status === 'requested').length}
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
                    {collections.filter(c => c.status === 'missed').length}
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
                {status === 'all' ? collections.length : collections.filter(c => c.status === status).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Collections List */}
      {collections.length === 0 ? (
        <div className="text-center py-12">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No collections found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' ? 'No collection records available.' : `No ${filter} collections found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection._id}
              collection={collection}
              userType={user.userType}
              onStart={() => startCollection(collection._id)}
              onComplete={(data) => completeCollection(collection._id, data)}
              onMarkMissed={(reason) => markMissed(collection._id, reason)}
            />
          ))}
        </div>
      )}

      {/* Schedule Collection Modal */}
      {showScheduleModal && (
        <ScheduleCollectionModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSubmit={(data) => {
            // Handle schedule collection
            toast.success('Collection scheduled successfully!');
            setShowScheduleModal(false);
            fetchCollections();
          }}
        />
      )}
    </div>
  );
};

// Collection Card Component
const CollectionCard = ({ collection, userType, onStart, onComplete, onMarkMissed }) => {
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showMissedModal, setShowMissedModal] = useState(false);

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

        {userType === 'collector' && (
          <div className="flex space-x-3">
            {collection.status === 'scheduled' && (
              <button
                onClick={onStart}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <PlayIcon className="h-4 w-4" />
                <span>Start Collection</span>
              </button>
            )}
            
            {collection.status === 'in_progress' && (
              <>
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Complete</span>
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

      {/* Complete Collection Modal */}
      {showCompleteModal && (
        <CompleteCollectionModal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          onSubmit={(data) => {
            onComplete(data);
            setShowCompleteModal(false);
          }}
        />
      )}

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

// Schedule Collection Modal
const ScheduleCollectionModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    wasteBin: '',
    scheduledDate: '',
    collector: '',
    wasteType: 'general'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Collection</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Waste Bin ID</label>
            <input
              type="text"
              value={formData.wasteBin}
              onChange={(e) => setFormData(prev => ({ ...prev, wasteBin: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Enter bin ID"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Scheduled Date & Time</label>
            <input
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Waste Type</label>
            <select
              value={formData.wasteType}
              onChange={(e) => setFormData(prev => ({ ...prev, wasteType: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="general">General Waste</option>
              <option value="recyclable">Recyclable</option>
              <option value="organic">Organic</option>
              <option value="hazardous">Hazardous</option>
              <option value="electronic">Electronic</option>
            </select>
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
              Schedule Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Collections;