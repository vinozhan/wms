import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { wasteBinAPI, userAPI, binRequestAPI, collectionAPI } from '../../utils/api';
import { 
  TrashIcon, 
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Recycle, BarChart3, Clock, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  WasteBinCard, 
  BinDetailsModal, 
  CreateBinModal, 
  RequestBinModal,
  BinRequestCard,
  BinApprovalModal,
  ScheduleCollectionModal 
} from '../../components/WasteBins';
import InstallBinModal from '../../components/modals/InstallBinModal';

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
  const [scheduledCollections, setScheduledCollections] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState(null);
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [selectedRequestForEdit, setSelectedRequestForEdit] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [selectedRequestForInstall, setSelectedRequestForInstall] = useState(null);
  const [installLoading, setInstallLoading] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');

  useEffect(() => {
    fetchWasteBins();
    fetchPendingRequests();
    fetchScheduledCollections();
    fetchBinRequests(); // All users can see their own bin requests
    if (user?.userType === 'admin' || user?.userType === 'collector') {
      fetchUsers();
    }
  }, [user]);

  // Refresh collection status every 10 seconds for more responsive updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchScheduledCollections();
      fetchPendingRequests();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
      // These are collections that residents/businesses have requested but not yet scheduled by collectors
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

  const fetchScheduledCollections = async () => {
    try {
      // Only fetch active collections (scheduled and in_progress)
      // Completed collections should not affect button state
      const response = await collectionAPI.getCollections({ 
        status: ['scheduled', 'in_progress'] 
      });
      setScheduledCollections(response.data.collections);
    } catch (error) {
      console.error('Failed to fetch scheduled collections:', error);
      // Don't show error toast as this is not critical
    }
  };

  const getCollectionStatus = (binId) => {
    if (!binId) return null;
    
    const collection = scheduledCollections.find(collection => {
      if (!collection || !collection.wasteBin || !collection.status) return false;
      const wasteBinId = typeof collection.wasteBin === 'string' 
        ? collection.wasteBin 
        : collection.wasteBin._id;
      return wasteBinId === binId && ['scheduled', 'in_progress'].includes(collection.status);
    });

    if (!collection) return null;
    
    return collection.status;
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
      
      // Refresh bin requests to show the new request immediately
      fetchBinRequests();
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
      
      // Update local state with calculated capacity
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
                },
                capacity: {
                  ...bin.capacity,
                  current: Math.round((newFillLevel / 100) * bin.capacity.total * 10) / 10
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
          },
          capacity: {
            ...prev.capacity,
            current: Math.round((newFillLevel / 100) * prev.capacity.total * 10) / 10
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
      
      // Refresh all relevant data
      fetchWasteBins();
      fetchPendingRequests();
      fetchScheduledCollections();
      
      // Close modal
      setShowScheduleModal(false);
      setSelectedBinForScheduling(null);
      
      toast.success('Collection scheduled successfully!');
    } catch (error) {
      console.error('Failed to schedule collection:', error);
      throw error; // Let the modal handle the error message
    }
  };

  const handleViewDetails = (bin) => {
    setSelectedBin(bin);
    setShowBinDetailsModal(true);
  };

  const handleOpenApprovalModal = (request) => {
    setSelectedRequestForApproval(request);
    setShowApprovalModal(true);
  };

  const handleApproveBinRequest = async (requestId, binData) => {
    try {
      // Only approve the request - bin creation happens when collector installs
      await binRequestAPI.approveBinRequest(requestId, binData);
      
      toast.success('Bin request approved successfully! Collector can now install the bin.');
      
      // Refresh bin requests
      fetchBinRequests();
      
      // Close modal
      setShowApprovalModal(false);
      setSelectedRequestForApproval(null);
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

  const handleEditRequest = (request) => {
    setSelectedRequestForEdit(request);
    setShowEditRequestModal(true);
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this bin request?')) {
      try {
        await binRequestAPI.deleteBinRequest(requestId);
        toast.success('Bin request deleted successfully!');
        fetchBinRequests();
      } catch (error) {
        console.error('Failed to delete bin request:', error);
        toast.error('Failed to delete bin request.');
      }
    }
  };

  const handleUpdateRequest = async (requestData) => {
    try {
      await binRequestAPI.updateBinRequest(selectedRequestForEdit._id, requestData);
      toast.success('Bin request updated successfully!');
      fetchBinRequests();
      setShowEditRequestModal(false);
      setSelectedRequestForEdit(null);
    } catch (error) {
      console.error('Failed to update bin request:', error);
      toast.error('Failed to update bin request.');
    }
  };

  const handleInstallBin = (request) => {
    setSelectedRequestForInstall(request);
    setShowInstallModal(true);
  };

  const handleConfirmInstall = async (request) => {
    setInstallLoading(true);
    try {
      // Create the waste bin from the approved request data
      const coordinates = request.approvalData?.location?.coordinates || {
        latitude: request.requester?.address?.coordinates?.latitude || 6.9271,
        longitude: request.requester?.address?.coordinates?.longitude || 79.8612
      };

      const binData = {
        binId: request.approvalData?.binId || `BIN-${Date.now()}`, // Use approved binId
        deviceId: request.approvalData?.deviceId || `DEV-${Date.now()}`, // Use approved deviceId
        deviceType: request.approvalData?.deviceType || request.deviceType || 'smart_sensor',
        binType: request.binType,
        owner: request.requester._id || request.requester,
        capacity: request.approvalData?.capacity || request.capacity || { total: 60, unit: 'liters' },
        location: {
          address: request.approvalData?.location?.address || request.preferredLocation,
          coordinates: [coordinates.longitude, coordinates.latitude] // Convert to array format [lng, lat]
        },
        status: 'active',
        installationDate: new Date().toISOString()
      };

      console.log('Bin data being sent:', binData);

      // First create the waste bin
      await wasteBinAPI.createWasteBin(binData);
      
      // Then mark the request as completed
      await binRequestAPI.completeBinRequest(request._id, {});
      
      toast.success('Bin installed successfully! Waste bin created and added to resident/business account.');
      
      // Refresh both bins and requests
      fetchWasteBins();
      fetchBinRequests();
      
      // Close modal
      setShowInstallModal(false);
      setSelectedRequestForInstall(null);
    } catch (error) {
      console.error('Failed to install bin:', error);
      toast.error('Failed to install bin. Please try again.');
    } finally {
      setInstallLoading(false);
    }
  };

  const getFilteredBinRequests = () => {
    if (requestStatusFilter === 'all') {
      return binRequests;
    }
    return binRequests.filter(request => {
      if (requestStatusFilter === 'installed') {
        return request.status === 'completed' || request.status === 'installed';
      }
      return request.status === requestStatusFilter;
    });
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


      {/* Tabs - Available for all user types */}
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
            {user?.userType === 'admin' || user?.userType === 'collector' ? 'Waste Bins' : 'My Waste Bins'}
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
            {user?.userType === 'admin' || user?.userType === 'collector' ? 'Bin Requests' : 'My Requests'}
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
              {user?.userType === 'admin' || user?.userType === 'collector' 
                ? binRequests.filter(req => req.status === 'pending').length
                : binRequests.length
              }
            </span>
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'bins' ? (
        // Waste Bins Grid (for all user types)
        <>
          {/* Waste Bins Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

          {wasteBins.length === 0 ? (
            <div className="text-center py-12">
              <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {user?.userType === 'admin' || user?.userType === 'collector' 
                  ? 'No waste bins' 
                  : 'No waste bins yet'
                }
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {user?.userType === 'admin' || user?.userType === 'collector'
                  ? 'Get started by creating your first waste bin.'
                  : 'Request your first waste bin to get started.'
                }
              </p>
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
                  collectionStatus={getCollectionStatus(bin._id)}
                  userType={user?.userType}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        // Bin Requests Grid (for all user types)
        <>
          {/* Bin Requests Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                        {binRequests.filter(r => r.status === 'pending').length}
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
                        {binRequests.filter(r => r.status === 'approved').length}
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Installed</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {binRequests.filter(r => r.status === 'completed' || r.status === 'installed').length}
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
                        {binRequests.filter(r => r.status === 'rejected').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bin Request Status Filter Tabs */}
          {(user?.userType === 'admin' || user?.userType === 'collector') && (
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: 'All', count: binRequests.length },
                  { key: 'pending', label: 'Pending', count: binRequests.filter(r => r.status === 'pending').length },
                  { key: 'approved', label: 'Approved', count: binRequests.filter(r => r.status === 'approved').length },
                  { key: 'installed', label: 'Installed', count: binRequests.filter(r => r.status === 'completed' || r.status === 'installed').length },
                  { key: 'rejected', label: 'Rejected', count: binRequests.filter(r => r.status === 'rejected').length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setRequestStatusFilter(tab.key)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      requestStatusFilter === tab.key
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                      requestStatusFilter === tab.key
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          )}

          {getFilteredBinRequests().length === 0 ? (
            <div className="text-center py-12">
              <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {requestStatusFilter === 'all' 
                  ? (user?.userType === 'admin' || user?.userType === 'collector' ? 'No bin requests' : 'No requests yet')
                  : `No ${requestStatusFilter} requests`
                }
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {requestStatusFilter === 'all' 
                  ? (user?.userType === 'admin' || user?.userType === 'collector' 
                    ? 'No pending bin requests at the moment.' 
                    : 'Submit your first bin request to get started.')
                  : `No requests with ${requestStatusFilter} status found.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredBinRequests().map((request) => (
                <BinRequestCard
                  key={request._id}
                  request={request}
                  onApprove={user?.userType === 'admin' ? handleApproveBinRequest : null}
                  onReject={user?.userType === 'admin' ? handleRejectBinRequest : null}
                  onOpenApprovalModal={user?.userType === 'admin' ? handleOpenApprovalModal : null}
                  onEdit={user?.userType === 'resident' || user?.userType === 'business' ? handleEditRequest : null}
                  onDelete={user?.userType === 'resident' || user?.userType === 'business' ? handleDeleteRequest : null}
                  onInstall={user?.userType === 'collector' ? handleInstallBin : null}
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
        currentUser={user}
      />

      {/* Bin Approval Modal */}
      <BinApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedRequestForApproval(null);
        }}
        onApprove={handleApproveBinRequest}
        request={selectedRequestForApproval}
      />

      {/* Edit Request Modal */}
      <RequestBinModal
        isOpen={showEditRequestModal}
        onClose={() => {
          setShowEditRequestModal(false);
          setSelectedRequestForEdit(null);
        }}
        onSubmit={handleUpdateRequest}
        currentUser={user}
        editMode={true}
        existingRequest={selectedRequestForEdit}
      />

      {/* Install Bin Modal */}
      <InstallBinModal
        isOpen={showInstallModal}
        onClose={() => {
          setShowInstallModal(false);
          setSelectedRequestForInstall(null);
        }}
        onConfirm={handleConfirmInstall}
        request={selectedRequestForInstall}
        loading={installLoading}
      />
    </div>
  );
};

export default WasteBins;
