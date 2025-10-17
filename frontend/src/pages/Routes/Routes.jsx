import React, { useState, useEffect } from 'react';
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
  CpuChipIcon
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <RouteIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Routes</dt>
                  <dd className="text-lg font-medium text-gray-900">{pagination.totalRoutes}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Routes</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {routes.filter(r => r.status === 'active').length}
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
                <CpuChipIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Optimized Routes</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {routes.filter(r => r.optimization?.isOptimized).length}
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
                <TruckIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Stops</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {routes.length > 0 ? Math.round(routes.reduce((sum, r) => sum + (r.wasteBins?.length || 0), 0) / routes.length) : 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
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
      </div>

      {/* Routes Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stops
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <RouteIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{route.name}</div>
                        <div className="text-sm text-gray-500">
                          {route.cities?.startCity} → {route.cities?.endCity}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{route.assignedCollector?.name}</div>
                    <div className="text-sm text-gray-500">{route.assignedCollector?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                      {getStatusIcon(route.status)}
                      <span className="ml-1 capitalize">{route.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.wasteBins?.length || 0} bins
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {route.schedule?.startTime} - {route.schedule?.endTime}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {route.schedule?.frequency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => viewRouteDetails(route._id)}
                        className="text-blue-600 hover:text-blue-500"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {user?.userType === 'admin' && (
                        <>
                          <button
                            onClick={() => handleOptimizeRoute(route._id)}
                            className="text-purple-600 hover:text-purple-500"
                            title="Optimize Route"
                          >
                            <CpuChipIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteRoute(route._id)}
                            className="text-red-600 hover:text-red-500"
                            title="Delete Route"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchRoutes(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchRoutes(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => fetchRoutes(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchRoutes(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Route Details Modal */}
      {showRouteModal && (
        <RouteDetailsModal
          route={selectedRoute}
          onClose={() => {
            setShowRouteModal(false);
            setSelectedRoute(null);
          }}
          onUpdate={() => {
            fetchRoutes(pagination.currentPage);
            setShowRouteModal(false);
            setSelectedRoute(null);
          }}
        />
      )}

      {/* Add Route Modal */}
      <AddRouteModal
        isOpen={showAddRouteModal}
        onClose={() => setShowAddRouteModal(false)}
        onRouteAdded={(newRoute) => {
          fetchRoutes(pagination.currentPage);
          setShowAddRouteModal(false);
        }}
      />
    </div>
  );
};

// Route Details Modal Component
const RouteDetailsModal = ({ route, onClose, onUpdate }) => {
  if (!route) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Route Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Route Information</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RouteIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{route.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{route.district}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {route.cities?.startCity} → {route.cities?.endCity}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Assignment</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Collector:</span> {route.assignedCollector?.name}
                </div>
                {route.backupCollector && (
                  <div className="text-sm">
                    <span className="font-medium">Backup:</span> {route.backupCollector?.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Schedule</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Frequency:</span> {route.schedule?.frequency}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Time:</span> {route.schedule?.startTime} - {route.schedule?.endTime}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Days:</span> {route.schedule?.daysOfWeek?.join(', ')}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Statistics</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Total Stops:</span> {route.wasteBins?.length || 0}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Estimated Time:</span> {route.optimization?.estimatedTime || 0} min
                </div>
                <div className="text-sm">
                  <span className="font-medium">Status:</span> 
                  <span className="ml-1 capitalize">{route.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {route.wasteBins && route.wasteBins.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Waste Bins ({route.wasteBins.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {route.wasteBins.map((binInfo, index) => (
                <div key={binInfo.bin._id} className="p-3 border border-gray-200 rounded-md">
                  <div className="text-sm font-medium">{binInfo.bin.binId}</div>
                  <div className="text-xs text-gray-500">Order: {binInfo.sequenceOrder}</div>
                  <div className="text-xs text-gray-500">Priority: {binInfo.priority}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Routes;