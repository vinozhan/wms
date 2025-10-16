import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { wasteBinAPI, collectionAPI, userAPI, analyticsAPI, routeAPI } from '../../utils/api';
import { 
  TrashIcon, 
  TruckIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  BellIcon,
  MapPinIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { AlertTriangle, Recycle, Calendar, Route as RouteIcon, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

// Quick Action Button Component
const QuickActionButton = ({ icon, title, description, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
  >
    <div className="flex items-center">
      {icon}
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  </button>
);

// Special Collection Modal Component
const SpecialCollectionModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    collectionType: 'bulk',
    description: '',
    preferredDate: '',
    contactPhone: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Special Collection</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Collection Type</label>
              <select 
                value={formData.collectionType}
                onChange={(e) => setFormData(prev => ({ ...prev, collectionType: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="bulk">Bulk Items</option>
                <option value="hazardous">Hazardous Waste</option>
                <option value="electronic">Electronic Items</option>
                <option value="garden">Garden Waste</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows="3"
                placeholder="Describe the items to be collected..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Date</label>
              <input 
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
              <input 
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Contact number for collection"
                required
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
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Schedule Collection
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Admin Schedule Collection Modal Component
const AdminScheduleCollectionModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    wasteBin: '',
    scheduledDate: '',
    wasteType: 'general',
    collector: '',
    priority: 'normal'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
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
                min={new Date().toISOString().slice(0, 16)}
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Collector ID (Optional)</label>
              <input 
                type="text"
                value={formData.collector}
                onChange={(e) => setFormData(prev => ({ ...prev, collector: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Assign to specific collector"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
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
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Schedule Collection
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    wasteBins: {},
    collections: {},
    loading: true
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [showSpecialCollectionModal, setShowSpecialCollectionModal] = useState(false);
  const [showAdminScheduleModal, setShowAdminScheduleModal] = useState(false);
  const [collectorRoutes, setCollectorRoutes] = useState([]);
  const [todaysCollections, setTodaysCollections] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      const promises = [];
      
      if (user.userType === 'admin') {
        promises.push(
          wasteBinAPI.getBinStats(),
          collectionAPI.getCollectionStats(),
          userAPI.getUserStats()
        );
      } else if (user.userType === 'collector') {
        // CHANGED: Fetch all assigned routes and collections for today for the collector
        promises.push(
          routeAPI.getCollectorRoutes(user._id),
          collectionAPI.getCollections({ 
            collector: user._id, 
            date: new Date().toISOString().split('T')[0] // Filter for today
          })
        );
      } else {
        promises.push(
          wasteBinAPI.getWasteBins({ owner: user._id }),
          collectionAPI.getCollections({ limit: 5 })
        );
      }

      const results = await Promise.all(promises);
      
      if (user.userType === 'admin') {
        setStats({
          wasteBins: results[0].data,
          collections: results[1].data,
          users: results[2].data,
          loading: false
        });
      } else if (user.userType === 'collector') {
        const routes = results[0].data.routes || [];
        const collections = results[1].data.collections || [];
        
        setCollectorRoutes(routes);
        setTodaysCollections(collections); // Set all collections for today
        
        const completedTodayCount = collections.filter(c => c.status === 'completed').length;

        setStats({
          routes: { total: routes.length, active: routes.filter(r => r.status === 'active').length },
          collectionsToday: { total: collections.length, completed: completedTodayCount },
          loading: false
        });
      } else {
        setStats({
          wasteBins: { overview: { total: results[0].data.wasteBins.length } },
          collections: results[1].data,
          loading: false
        });
        setRecentActivity(results[1].data.collections || []);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error("Failed to fetch dashboard data.");
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSpecialCollection = async (formData) => {
    try {
      toast.success(`Special collection for ${formData.collectionType} scheduled for ${formData.preferredDate}`);
    } catch (error) {
      toast.error('Failed to schedule special collection');
    }
  };

  const handleAdminScheduleCollection = async (formData) => {
    try {
      const collectionData = {
        wasteBin: formData.wasteBin,
        scheduledDate: formData.scheduledDate,
        wasteData: {
          wasteType: formData.wasteType,
          priority: formData.priority
        }
      };

      if (formData.collector) {
        collectionData.collector = formData.collector;
      }

      await collectionAPI.createCollection(collectionData);
      toast.success('Collection scheduled successfully!');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to schedule collection:', error);
      toast.error('Failed to schedule collection');
    }
  };

  // NEW: Function to handle marking a stop as collected
  const handleMarkAsCollected = async (collectionId) => {
    try {
      // Assumes an API endpoint exists to update a collection's status
      await collectionAPI.updateCollection(collectionId, { status: 'completed' });
      toast.success('Stop marked as collected!');
      // Refresh the dashboard to show the updated status
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to update collection status:', error);
      toast.error('Could not update status. Please try again.');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const reportData = { type: 'weekly', includeCharts: true };
      const response = await analyticsAPI.generateReport(reportData);
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `waste-management-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report generated and downloaded successfully!');
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAdminScheduleModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Schedule Collection</span>
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
          >
            {generatingReport ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <DocumentArrowDownIcon className="h-5 w-5" />
            )}
            <span>{generatingReport ? 'Generating...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <p className="text-sm font-medium text-gray-500 truncate">Total Waste Bins</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.wasteBins.overview?.total || 0}</p>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <p className="text-sm font-medium text-gray-500 truncate">Collections Today</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.collections.overview?.today || 0}</p>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <p className="text-sm font-medium text-gray-500 truncate">Total Users</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.users?.overview?.total || 0}</p>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <p className="text-sm font-medium text-red-500 truncate">Alerts</p>
            <p className="mt-1 text-3xl font-semibold text-red-600">
                {(stats.wasteBins.overview?.needsCollection || 0) + (stats.collections.overview?.missed || 0)}
            </p>
        </div>
      </div>
    </div>
  );

  const renderUserDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowSpecialCollectionModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Schedule Collection
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Collections</h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((collection, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center">
                  <TruckIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(collection.scheduledDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">{collection.wasteData.wasteType}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  collection.status === 'completed' ? 'bg-green-100 text-green-800' :
                  collection.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {collection.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <QuickActionButton
              icon={<Calendar className="h-5 w-5 text-gray-400 mr-3" />}
              title="Schedule Special Collection"
              description="For bulk or hazardous items"
              onClick={() => setShowSpecialCollectionModal(true)}
            />
            <QuickActionButton
              icon={<CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-3" />}
              title="View Bills & Payments"
              description="Manage your account"
              onClick={() => navigate('/payments')}
            />
            <QuickActionButton
              icon={<MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />}
              title="Manage Waste Bins"
              description="Add or update bin locations"
              onClick={() => navigate('/waste-bins')}
            />
          </div>
        </div>
      </div>
      <SpecialCollectionModal
        isOpen={showSpecialCollectionModal}
        onClose={() => setShowSpecialCollectionModal(false)}
        onSubmit={handleSpecialCollection}
      />
    </div>
  );

  // CHANGED: Complete overhaul of the collector dashboard as per your request
  const renderCollectorDashboard = () => (
    <div className="space-y-6">
      {/* REMOVED: Top action buttons are gone */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600">Here's your collection dashboard</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500 truncate">Assigned Routes</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.routes?.total || 0}</p>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500 truncate">Today's Total Stops</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.collectionsToday?.total || 0}</p>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500 truncate">Completed Stops</p>
          <p className="mt-1 text-3xl font-semibold text-green-600">{stats.collectionsToday?.completed || 0}</p>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500 truncate">Pending Stops</p>
          <p className="mt-1 text-3xl font-semibold text-orange-600">
            {(stats.collectionsToday?.total || 0) - (stats.collectionsToday?.completed || 0)}
          </p>
        </div>
      </div>

      {/* Routes and Collections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHANGED: Assigned Routes now shows ALL routes */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">My Routes</h3>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto"> {/* Added scroll for long lists */}
            {collectorRoutes.length === 0 ? (
              <div className="text-center py-8">
                <RouteIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No routes assigned</h3>
                <p className="mt-1 text-sm text-gray-500">Contact your admin for route assignments.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {collectorRoutes.map((route) => (
                  <div key={route._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <RouteIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{route.name}</h4>
                          <div className="text-xs text-gray-500 flex items-center space-x-1">
                            <span>{route.cities?.startCity} → {route.cities?.endCity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">{route.wasteBins?.length || 0} stops</div>
                        <div className="text-xs capitalize text-gray-500">{route.schedule?.frequency}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CHANGED: Today's Collections now shows ALL stops with an action button */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Today's Collection Stops</h3>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto"> {/* Added scroll for long lists */}
            {todaysCollections.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No collections today</h3>
                <p className="mt-1 text-sm text-gray-500">Enjoy your day or check upcoming schedules.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysCollections.map((collection) => (
                  <div key={collection._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center ${collection.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {collection.status === 'completed' ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <TrashIcon className="h-5 w-5 text-blue-600" />}
                        </div>
                        <div>
                          <h4 className={`text-sm font-medium ${collection.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {collection.wasteBin?.location?.address || 'Address not available'}
                          </h4>
                          <div className="text-xs text-gray-500">
                            Bin ID: {collection.wasteBin?.binId} • Priority: {collection.priority || 'Normal'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {collection.status !== 'completed' && (
                          <button
                            onClick={() => handleMarkAsCollected(collection._id)}
                            className="bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-md hover:bg-green-600"
                          >
                            Collected
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REMOVED: Quick Actions panel simplified */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* The first two quick actions have been removed */}
            <QuickActionButton
              icon={<DocumentArrowDownIcon className="h-5 w-5 text-purple-600 mr-3" />}
              title="Collection Report"
              description="Submit collection completion report"
              onClick={() => navigate('/collections/report')} // Assuming a report page
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Main render logic
  if (user.userType === 'admin') {
    return renderAdminDashboard();
  } else if (user.userType === 'collector') {
    return renderCollectorDashboard();
  } else {
    return renderUserDashboard();
  }
};

export default Dashboard;