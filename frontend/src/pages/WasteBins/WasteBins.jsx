import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { wasteBinAPI, userAPI, binRequestAPI, collectionAPI } from '../../utils/api';
import { 
  TrashIcon, 
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Recycle, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  WasteBinCard, 
  BinDetailsModal, 
  CreateBinModal, 
  RequestBinModal,
  BinRequestCard,
  ScheduleCollectionModal 
} from '../../components/WasteBins';

const WasteBins = () => {
  const { user } = useAuth();
  const [wasteBins, setWasteBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedBin, setSelectedBin] = useState(null);
  const [showBinDetailsModal, setShowBinDetailsModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [binRequests, setBinRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('bins');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedBinForScheduling, setSelectedBinForScheduling] = useState(null);

  useEffect(() => {
    fetchWasteBins();
    fetchPendingRequests();
    if (user?.userType === 'admin' || user?.userType === 'collector') {
      fetchUsers();
      fetchBinRequests();
    }
  }, [user]);

  const fetchWasteBins = async () => {
    try {
      setLoading(true);
      const response = await wasteBinAPI.getWasteBins();
      setWasteBins(response.data.wasteBins);
    } catch (error) {
      console.error('Failed to fetch waste bins:', error);
      toast.error('Failed to load waste bins');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userAPI.getUsers({ limit: 100 });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      // Fetch collections with 'requested' status for current user
      const response = await collectionAPI.getCollections({ status: 'requested' });
      setPendingRequests(response.data.collections);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      // Don't show error toast as this is not critical
    }
  };

  const fetchBinRequests = async () => {
    try {
      const response = await binRequestAPI.getBinRequests();
      setBinRequests(response.data.requests);
    } catch (error) {
      console.error('Failed to fetch bin requests:', error);
      // Don't show error toast as this is not critical
    }
  };


  const hasPendingRequest = (binId) => {
    return pendingRequests.some(request => 
      request.wasteBin === binId || request.wasteBin._id === binId
    );
  };

  const handleRequestCollection = async (bin) => {
    try {
      // Check for existing pending request
      if (hasPendingRequest(bin._id)) {
        toast.error('A collection request for this bin is already pending.');
        return;
      }

      const collectionData = {
        wasteBin: bin._id,
        scheduledDate: new Date().toISOString(),
        wasteData: {
          wasteType: bin.binType,
          priority: bin.sensorData?.fillLevel >= 80 ? 'urgent' : 'medium'
        },
        location: {
          coordinates: bin.location?.coordinates || [0, 0]
        },
        verification: {
          method: 'manual_entry'
        }
      };

      await collectionAPI.createCollection(collectionData);
      toast.success('Collection request submitted successfully!');
      
      // Refresh both waste bins and pending requests
      fetchWasteBins();
      fetchPendingRequests();
    } catch (error) {
      console.error('Failed to request collection:', error);
      toast.error('Failed to request collection. Please try again.');
    }
  };

  const handleCreateBin = async (binData) => {
    try {
      await wasteBinAPI.createWasteBin(binData);
      toast.success('Waste bin created successfully!');
      fetchWasteBins();
    } catch (error) {
      console.error('Failed to create waste bin:', error);
      toast.error('Failed to create waste bin');
    }
  };

  const handleBinRequest = async (requestData) => {
    try {
      await binRequestAPI.createBinRequest(requestData);
      toast.success('Bin request submitted successfully! We will contact you within 2-3 business days.');
    } catch (error) {
      console.error('Failed to submit bin request:', error);
      toast.error('Failed to submit bin request. Please try again.');
    }
  };

  const handleUpdateFillLevel = async (binId, newFillLevel) => {
    try {
      // Use the sensor data update endpoint
      await wasteBinAPI.updateSensorData(binId, {
        fillLevel: newFillLevel,
        lastUpdated: new Date().toISOString(),
        manuallyUpdated: true,
        updatedBy: user._id
      });
      
      // Update local state
      setWasteBins(bins => 
        bins.map(bin => 
          bin._id === binId 
            ? {
                ...bin,
                sensorData: {
                  ...bin.sensorData,
                  fillLevel: newFillLevel,
                  lastUpdated: new Date().toISOString(),
                  manuallyUpdated: true,
                  updatedBy: user._id
                }
              }
            : bin
        )
      );
      
      // Update selected bin if it's the one being edited
      if (selectedBin?._id === binId) {
        setSelectedBin(prev => ({
          ...prev,
          sensorData: {
            ...prev.sensorData,
            fillLevel: newFillLevel,
            lastUpdated: new Date().toISOString(),
            manuallyUpdated: true,
            updatedBy: user._id
          }
        }));
      }
      
    } catch (error) {
      console.error('Failed to update fill level:', error);
      // Provide more specific error messages
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to update this bin');
      } else if (error.response?.status === 404) {
        throw new Error('Bin not found');
      } else {
        throw new Error('Failed to update fill level. Please try again.');
      }
    }
  };

  const handleScheduleCollection = (bin) => {
    if (user?.userType === 'collector' && hasPendingRequest(bin._id)) {
      toast.error('Collection already scheduled for this bin');
      return;
    }
    
    setSelectedBinForScheduling(bin);
    setShowScheduleModal(true);
  };

  const handleSubmitScheduledCollection = async (collectionData) => {
    try {
      await collectionAPI.createCollection(collectionData);
      
      // Refresh both waste bins and pending requests
      fetchWasteBins();
      fetchPendingRequests();
    } catch (error) {
      console.error('Failed to schedule collection:', error);
      throw error; // Let the modal handle the error message
    }
  };

  const handleViewDetails = (bin) => {
    setSelectedBin(bin);
    setShowBinDetailsModal(true);
  };

  const handleApproveBinRequest = async (requestId) => {
    try {
      await binRequestAPI.approveBinRequest(requestId, {});
      toast.success('Bin request approved successfully!');
      fetchBinRequests();
    } catch (error) {
      console.error('Failed to approve bin request:', error);
      toast.error('Failed to approve bin request.');
    }
  };

  const handleRejectBinRequest = async (requestId) => {
    try {
      await binRequestAPI.rejectBinRequest(requestId, {});
      toast.success('Bin request rejected.');
      fetchBinRequests();
    } catch (error) {
      console.error('Failed to reject bin request:', error);
      toast.error('Failed to reject bin request.');
    }
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
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.userType === 'admin' ? 'Waste Bins Management' : 
             user?.userType === 'collector' ? 'Waste Bins' : 'My Waste Bins'}
          </h1>
          <p className="text-gray-600">
            {user?.userType === 'admin' ? 'Create and manage all waste bins in the system' :
             user?.userType === 'collector' ? 'Create and monitor waste bins on your routes' :
             'Monitor and manage your waste bins'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>
            {user?.userType === 'admin' || user?.userType === 'collector' ? 'Add New Bin' : 'Request New Bin'}
          </span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrashIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bins</dt>
                  <dd className="text-lg font-medium text-gray-900">{wasteBins.length}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Need Collection</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {wasteBins.filter(bin => bin.sensorData?.fillLevel >= 80 || bin.status === 'full').length}
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
                <Recycle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recyclable</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {wasteBins.filter(bin => bin.binType === 'recyclable').length}
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
                <BarChart3 className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Fill Level</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {wasteBins.length > 0 
                      ? Math.round(wasteBins.reduce((sum, bin) => sum + (bin.sensorData?.fillLevel || 0), 0) / wasteBins.length)
                      : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {(user?.userType === 'admin' || user?.userType === 'collector') && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('bins')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bins'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Waste Bins
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {wasteBins.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bin Requests
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {binRequests.filter(req => req.status === 'pending').length}
              </span>
            </button>
          </nav>
        </div>
      )}

      {/* Content based on user type and active tab */}
      {(user?.userType === 'admin' || user?.userType === 'collector') ? (
        // Admin/Collector view with tabs
        activeTab === 'bins' ? (
          // Waste Bins Grid
          <>
            {wasteBins.length === 0 ? (
              <div className="text-center py-12">
                <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No waste bins</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first waste bin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wasteBins.map((bin) => (
                  <WasteBinCard
                    key={bin._id}
                    bin={bin}
                    onRequestCollection={handleRequestCollection}
                    onScheduleCollection={handleScheduleCollection}
                    onViewDetails={handleViewDetails}
                    hasPendingRequest={hasPendingRequest(bin._id)}
                    userType={user?.userType}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          // Bin Requests Grid
          <>
            {binRequests.length === 0 ? (
              <div className="text-center py-12">
                <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bin requests</h3>
                <p className="mt-1 text-sm text-gray-500">No pending bin requests at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {binRequests.map((request) => (
                  <BinRequestCard
                    key={request._id}
                    request={request}
                    onApprove={handleApproveBinRequest}
                    onReject={handleRejectBinRequest}
                  />
                ))}
              </div>
            )}
          </>
        )
      ) : (
        // Resident/Business view without tabs
        <>
          {wasteBins.length === 0 ? (
            <div className="text-center py-12">
              <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No waste bins</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by requesting your first waste bin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wasteBins.map((bin) => (
                <WasteBinCard
                  key={bin._id}
                  bin={bin}
                  onRequestCollection={handleRequestCollection}
                  onScheduleCollection={handleScheduleCollection}
                  onViewDetails={handleViewDetails}
                  hasPendingRequest={hasPendingRequest(bin._id)}
                  userType={user?.userType}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Bin Modal - Role Based */}
      {user?.userType === 'admin' || user?.userType === 'collector' ? (
        <CreateBinModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateBin}
          users={users}
          userType={user?.userType}
          currentUser={user}
        />
      ) : (
        <RequestBinModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleBinRequest}
          currentUser={user}
        />
      )}

      {/* Bin Details Modal */}
      <BinDetailsModal
        bin={selectedBin}
        isOpen={showBinDetailsModal}
        onClose={() => {
          setShowBinDetailsModal(false);
          setSelectedBin(null);
        }}
        onUpdateFillLevel={handleUpdateFillLevel}
      />

      {/* Schedule Collection Modal */}
      <ScheduleCollectionModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedBinForScheduling(null);
        }}
        onSubmit={handleSubmitScheduledCollection}
        selectedBin={selectedBinForScheduling}
      />
    </div>
  );
};

export default WasteBins;
