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
import { AlertTriangle, Recycle, TrendingUp, Calendar, Route as RouteIcon, Navigation } from 'lucide-react';
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
        promises.push(
          routeAPI.getCollectorRoutes(user._id),
          collectionAPI.getCollections({ collector: user._id, limit: 10 }),
          wasteBinAPI.getWasteBins({ limit: 50 })
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
        const allBins = results[2].data.wasteBins || [];
        
        setCollectorRoutes(routes);
        setTodaysCollections(collections.filter(c => {
          const collectionDate = new Date(c.scheduledDate);
          const today = new Date();
          return collectionDate.toDateString() === today.toDateString();
        }));
        
        setStats({
          wasteBins: { overview: { total: allBins.length } },
          collections: { overview: { total: collections.length } },
          routes: { total: routes.length, active: routes.filter(r => r.status === 'active').length },
          loading: false
        });
        setRecentActivity(collections.slice(0, 5));
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
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSpecialCollection = async (formData) => {
    try {
      // In a real application, you would call an API here
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
      fetchDashboardData(); // Refresh dashboard data
    } catch (error) {
      console.error('Failed to schedule collection:', error);
      toast.error('Failed to schedule collection');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      
      const reportData = {
        reportType: 'weekly',
        dateRange: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        scope: 'all'
      };

      const response = await analyticsAPI.generateReport(reportData);
      
      // Create download link for the report
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
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
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrashIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Waste Bins
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.wasteBins.overview?.total || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium">
                {stats.wasteBins.overview?.active || 0} active
              </span>
              <span className="text-gray-500"> • </span>
              <span className="text-red-600 font-medium">
                {stats.wasteBins.overview?.needsCollection || 0} need collection
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Collections Today
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.collections.overview?.today || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium">
                {stats.collections.overview?.efficiency || 0}% efficiency
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.users?.overview?.total || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium">
                {stats.users?.overview?.active || 0} active
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Alerts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(stats.wasteBins.overview?.needsCollection || 0) + (stats.collections.overview?.missed || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
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
                    <p className="text-sm font-medium">Collection #{collection.collectionId}</p>
                    <p className="text-xs text-gray-500">{collection.status}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  collection.status === 'completed' ? 'bg-green-100 text-green-800' :
                  collection.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {collection.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 border-l-4 border-red-400 bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {stats.wasteBins.overview?.needsCollection || 0} bins need collection
                </p>
                <p className="text-xs text-red-600">High priority</p>
              </div>
            </div>
            <div className="flex items-center p-3 border-l-4 border-yellow-400 bg-yellow-50">
              <BellIcon className="h-5 w-5 text-yellow-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {stats.collections.overview?.missed || 0} missed collections
                </p>
                <p className="text-xs text-yellow-600">Requires attention</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Schedule Collection Modal */}
      <AdminScheduleCollectionModal
        isOpen={showAdminScheduleModal}
        onClose={() => setShowAdminScheduleModal(false)}
        onSubmit={handleAdminScheduleCollection}
      />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrashIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    My Waste Bins
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.wasteBins.overview?.total || 0}
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
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Next Collection
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Tomorrow
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
                <Recycle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Recycling Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    75%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
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

      {/* Special Collection Modal */}
      <SpecialCollectionModal
        isOpen={showSpecialCollectionModal}
        onClose={() => setShowSpecialCollectionModal(false)}
        onSubmit={handleSpecialCollection}
      />
    </div>
  );

  const renderCollectorDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600">Here's your collection dashboard</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/routes')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <RouteIcon className="h-4 w-4" />
            <span>View Routes</span>
          </button>
          <button 
            onClick={() => navigate('/collections')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <TruckIcon className="h-4 w-4" />
            <span>Collections</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <RouteIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Assigned Routes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.routes?.total || 0}
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
                <Calendar className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Collections
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {todaysCollections.length}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Collections
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.collections?.overview?.total || 0}
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
                <CheckCircleIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Routes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.routes?.active || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Routes and Collections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Routes */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">My Routes</h3>
              <button 
                onClick={() => navigate('/routes')}
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {collectorRoutes.length === 0 ? (
              <div className="text-center py-8">
                <RouteIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No routes assigned</h3>
                <p className="mt-1 text-sm text-gray-500">Contact your admin for route assignments.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {collectorRoutes.slice(0, 3).map((route) => (
                  <div key={route._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <RouteIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{route.name}</h4>
                          <div className="text-xs text-gray-500 flex items-center space-x-1">
                            <Navigation className="h-3 w-3" />
                            <span>{route.cities?.startCity} → {route.cities?.endCity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">{route.wasteBins?.length || 0} stops</div>
                        <div className="text-xs text-gray-500">{route.schedule?.frequency}</div>
                      </div>
                    </div>
                    
                    {route.schedule && (
                      <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>{route.schedule.startTime} - {route.schedule.endTime}</span>
                        </div>
                        <div>
                          <span className="capitalize">{route.schedule.daysOfWeek?.join(', ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's Collections */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Today's Collections</h3>
              <button 
                onClick={() => navigate('/collections')}
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {todaysCollections.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No collections today</h3>
                <p className="mt-1 text-sm text-gray-500">Enjoy your day off or check upcoming schedules.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysCollections.slice(0, 5).map((collection) => (
                  <div key={collection._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <TrashIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {collection.wasteBin?.binId || 'Collection'}
                          </h4>
                          <div className="text-xs text-gray-500">
                            {collection.wasteType} • {collection.status}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          {new Date(collection.scheduledDate).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className="text-xs text-gray-500">{collection.priority}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionButton
              icon={<TruckIcon className="h-5 w-5 text-green-600 mr-3" />}
              title="Start Collection"
              description="Begin today's collection route"
              onClick={() => navigate('/collections')}
            />
            <QuickActionButton
              icon={<MapPinIcon className="h-5 w-5 text-blue-600 mr-3" />}
              title="View Routes"
              description="Check assigned routes and schedules"
              onClick={() => navigate('/routes')}
            />
            <QuickActionButton
              icon={<DocumentArrowDownIcon className="h-5 w-5 text-purple-600 mr-3" />}
              title="Collection Report"
              description="Submit collection completion report"
              onClick={() => navigate('/collections')}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Collections</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <TrashIcon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Collected {activity.wasteType} from {activity.wasteBin?.binId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.completedAt || activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {activity.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (user.userType === 'admin') {
    return renderAdminDashboard();
  } else if (user.userType === 'collector') {
    return renderCollectorDashboard();
  } else {
    return renderUserDashboard();
  }
};

export default Dashboard;