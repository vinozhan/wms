import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { wasteBinAPI } from '../../utils/api';
import { 
  TrashIcon, 
  PlusIcon, 
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Thermometer, Droplets, BarChart3, Recycle } from 'lucide-react';
import toast from 'react-hot-toast';

const WasteBins = () => {
  const { user } = useAuth();
  const [wasteBins, setWasteBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchWasteBins();
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

  const getStatusColor = (status, fillLevel) => {
    if (status === 'full' || fillLevel >= 80) return 'bg-red-100 text-red-800';
    if (status === 'maintenance') return 'bg-yellow-100 text-yellow-800';
    if (fillLevel >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusIcon = (status, fillLevel) => {
    if (status === 'full' || fillLevel >= 80) return <ExclamationTriangleIcon className="h-4 w-4" />;
    if (status === 'maintenance') return <ClockIcon className="h-4 w-4" />;
    return <CheckCircleIcon className="h-4 w-4" />;
  };

  const getBinTypeIcon = (binType) => {
    switch (binType) {
      case 'recyclable':
        return <Recycle className="h-6 w-6 text-green-600" />;
      case 'organic':
        return <TrashIcon className="h-6 w-6 text-brown-600" />;
      case 'hazardous':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
      case 'electronic':
        return <BarChart3 className="h-6 w-6 text-blue-600" />;
      default:
        return <TrashIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const requestSpecialCollection = async (binId) => {
    try {
      toast.success('Special collection request submitted!');
    } catch (error) {
      toast.error('Failed to request special collection');
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
          <h1 className="text-3xl font-bold text-gray-900">My Waste Bins</h1>
          <p className="text-gray-600">Monitor and manage your waste bins</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Request New Bin</span>
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

      {/* Waste Bins Grid */}
      {wasteBins.length === 0 ? (
        <div className="text-center py-12">
          <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No waste bins</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by requesting your first waste bin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wasteBins.map((bin) => (
            <div key={bin._id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getBinTypeIcon(bin.binType)}
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{bin.binId}</h3>
                      <p className="text-sm text-gray-500 capitalize">{bin.binType} waste</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bin.status, bin.sensorData?.fillLevel)}`}>
                    {getStatusIcon(bin.status, bin.sensorData?.fillLevel)}
                    <span className="ml-1 capitalize">{bin.status}</span>
                  </span>
                </div>

                {/* Fill Level */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Fill Level</span>
                    <span className="text-sm text-gray-500">{bin.sensorData?.fillLevel || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (bin.sensorData?.fillLevel || 0) >= 80 ? 'bg-red-500' :
                        (bin.sensorData?.fillLevel || 0) >= 60 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${bin.sensorData?.fillLevel || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Capacity */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{bin.capacity.current || 0} / {bin.capacity.total} {bin.capacity.unit}</span>
                  </div>
                </div>

                {/* Sensor Data */}
                {bin.sensorData && (
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    {bin.sensorData.temperature && (
                      <div className="flex items-center">
                        <Thermometer className="h-4 w-4 text-red-400 mr-2" />
                        <span className="text-sm text-gray-600">{bin.sensorData.temperature}°C</span>
                      </div>
                    )}
                    {bin.sensorData.humidity && (
                      <div className="flex items-center">
                        <Droplets className="h-4 w-4 text-blue-400 mr-2" />
                        <span className="text-sm text-gray-600">{bin.sensorData.humidity}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Location */}
                <div className="mb-4">
                  <div className="flex items-start">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <span className="text-sm text-gray-600">{bin.location.address}</span>
                  </div>
                </div>

                {/* Last Collection */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Collection:</span>
                    <span className="font-medium">{formatDate(bin.lastCollection?.date)}</span>
                  </div>
                  {bin.nextScheduledCollection && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Next Collection:</span>
                      <span className="font-medium text-green-600">
                        {formatDate(bin.nextScheduledCollection)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => requestSpecialCollection(bin._id)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    Request Collection
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-50">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Bin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request New Waste Bin</h3>
              <p className="text-sm text-gray-600 mb-4">
                Submit a request for a new waste bin. Our team will contact you within 2-3 business days.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bin Type</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="general">General Waste</option>
                    <option value="recyclable">Recyclable</option>
                    <option value="organic">Organic</option>
                    <option value="hazardous">Hazardous</option>
                    <option value="electronic">Electronic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Location</label>
                  <textarea 
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                    placeholder="Describe the preferred location for the bin..."
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success('Bin request submitted successfully!');
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteBins;