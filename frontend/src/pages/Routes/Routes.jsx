import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { routeAPI } from '../../utils/api';
import { 
  MapIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  TruckIcon,
  ClockIcon,
  CpuChipIcon,
  QrCodeIcon,
  ArrowUturnLeftIcon // Added for the revert button
} from '@heroicons/react/24/outline';
import { Route as RouteIcon, Navigation, MapPin } from 'lucide-react';
import AddRouteModal from '../../components/modals/AddRouteModal';
import toast from 'react-hot-toast';

const Routes = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRoutes: 0
  });

  useEffect(() => {
    fetchRoutes();
  }, [filter, searchTerm]);

  const fetchRoutes = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        status: filter !== 'all' ? filter : undefined
      };

      const response = await routeAPI.getRoutes(params);
      setRoutes(response.data.routes);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
      return;
    }

    try {
      await routeAPI.deleteRoute(routeId);
      toast.success('Route deleted successfully');
      fetchRoutes(pagination.currentPage);
    } catch (error) {
      console.error('Failed to delete route:', error);
      toast.error('Failed to delete route');
    }
  };

  const handleOptimizeRoute = async (routeId) => {
    try {
      await routeAPI.optimizeRoute(routeId, 'dijkstra');
      toast.success('Route optimized successfully');
      fetchRoutes(pagination.currentPage);
    } catch (error) {
      console.error('Failed to optimize route:', error);
      toast.error('Failed to optimize route');
    }
  };

  const viewRouteDetails = async (routeId) => {
    try {
      const response = await routeAPI.getRoute(routeId);
      setSelectedRoute(response.data.route);
      setShowRouteModal(true);
    } catch (error) {
      console.error('Failed to fetch route details:', error);
      toast.error('Failed to load route details');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="h-4 w-4" />;
      case 'inactive': return <XCircleIcon className="h-4 w-4" />;
      case 'maintenance': return <ClockIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      default: return <MapIcon className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Route Management</h1>
          <p className="text-gray-600">Manage collection routes and assignments</p>
        </div>
        
        {user?.userType === 'admin' && (
          <button
            onClick={() => setShowAddRouteModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Route</span>
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search routes by name or district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Routes</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collector</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{route.name}</div>
                    <div className="text-sm text-gray-500">{route.district}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{route.assignedCollector?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                      <span className="ml-1 capitalize">{route.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.wasteBins?.length || 0} bins</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => viewRouteDetails(route._id)} className="text-blue-600 hover:text-blue-500" title="View Details"><EyeIcon className="h-5 w-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRouteModal && (
        <RouteDetailsModal
          route={selectedRoute}
          onClose={() => {
            setShowRouteModal(false);
            setSelectedRoute(null);
          }}
          onUpdate={() => {
            viewRouteDetails(selectedRoute._id);
            fetchRoutes(pagination.currentPage);
          }}
        />
      )}

      <AddRouteModal
        isOpen={showAddRouteModal}
        onClose={() => setShowAddRouteModal(false)}
        onRouteAdded={() => fetchRoutes(pagination.currentPage)}
      />
    </div>
  );
};

// Route Details Modal Component
const RouteDetailsModal = ({ route, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [inputBinId, setInputBinId] = useState('');

  if (!route) return null;

  const binsSorted = useMemo(() => {
    if (!route.wasteBins) return [];
    return [...route.wasteBins].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }, [route.wasteBins]);

  const handleRecordCollection = async () => {
    const trimmedBinId = inputBinId.trim();
    if (!trimmedBinId) {
      toast.error('Please enter a Bin ID.');
      return;
    }

    const targetBinInfo = binsSorted.find(b => b.bin.binId.toLowerCase() === trimmedBinId.toLowerCase());

    if (!targetBinInfo) {
      toast.error(`Bin ID "${trimmedBinId}" is not part of this route.`);
      return;
    }

    if (targetBinInfo.status === 'completed') {
      toast.error(`Bin "${trimmedBinId}" has already been collected.`);
      setInputBinId('');
      return;
    }

    try {
      toast.loading('Recording collection...', { id: 'collect-toast' });
      await routeAPI.markBinAsCollected(route._id, trimmedBinId);
      toast.success(`Bin "${trimmedBinId}" recorded successfully!`, { id: 'collect-toast' });
      onUpdate();
      setInputBinId('');
    } catch (error) {
      console.error("Failed to mark bin as collected:", error);
      toast.error('Failed to record collection.', { id: 'collect-toast' });
    }
  };

  // --- NEW: HANDLER FOR REVERTING BIN STATUS ---
  const handleRevertStatus = async (binId) => {
    if (!binId) {
        toast.error('Invalid Bin ID provided.');
        return;
    }
    
    try {
        toast.loading('Reverting status...', { id: 'revert-toast' });
        // Make sure your api.js has this function
        await routeAPI.revertBinStatus(route._id, binId); 
        toast.success(`Bin ${binId} status reverted to pending.`, { id: 'revert-toast' });
        onUpdate();
    } catch (error) {
        console.error("Failed to revert bin status:", error);
        toast.error('Failed to revert status.', { id: 'revert-toast' });
    }
  };

  const getBinBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Route Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircleIcon className="h-6 w-6" /></button>
        </div>
        
        {user?.userType === 'collector' && (
          <div className="mb-6 pt-6 border-t">
            <h4 className="text-md font-medium text-gray-900 mb-3">Record Bin Collection</h4>
            <div className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <QrCodeIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={inputBinId}
                  onChange={(e) => setInputBinId(e.target.value)}
                  placeholder="Enter or Scan Bin ID to record collection"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button
                onClick={handleRecordCollection}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                <span>Record</span>
              </button>
            </div>
          </div>
        )}

        {binsSorted?.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Route Stops ({binsSorted.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {binsSorted.map((binInfo) => (
                <div key={binInfo.bin._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <div>
                    <div className={`text-sm font-medium ${binInfo.status === 'completed' ? 'text-gray-400 line-through' : ''}`}>
                      {binInfo.sequenceOrder}. {binInfo.bin?.location?.address || 'Address not available'}
                    </div>
                    <div className="text-xs text-gray-500">Bin ID: {binInfo.bin.binId}</div>
                  </div>
                  
                  {/* --- UPDATED SECTION WITH REVERT BUTTON --- */}
                  <div className="ml-4 flex items-center space-x-3">
                    {getBinBadge(binInfo.status)}
                    {binInfo.status === 'completed' && user?.userType === 'collector' && (
                      <button
                        onClick={() => handleRevertStatus(binInfo.bin.binId)}
                        className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-xs font-semibold hover:bg-red-200 transition-colors flex items-center space-x-1"
                        title="Revert to Pending"
                      >
                        <ArrowUturnLeftIcon className="h-3 w-3" />
                        <span>Revert</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-8">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
};

export default Routes;