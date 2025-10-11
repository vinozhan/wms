import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { wasteBinAPI, collectionAPI, userAPI } from '../../utils/api';
import { 
  TrashIcon, 
  TruckIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  BellIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { AlertTriangle, Recycle, TrendingUp, Calendar } from 'lucide-react';
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
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Generate Report
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
    </div>
  );

  const renderUserDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
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

  return user.userType === 'admin' ? renderAdminDashboard() : renderUserDashboard();
};

export default Dashboard;