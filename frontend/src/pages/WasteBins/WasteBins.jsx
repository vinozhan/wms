import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { wasteBinAPI, userAPI, binRequestAPI } from '../../utils/api';
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
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchWasteBins();
    if (user?.userType === 'admin' || user?.userType === 'collector') {
      fetchUsers();
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

      {/* Add Bin Modal - Role Based */}
      {showAddModal && (
        <>
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
        </>
      )}
    </div>
  );
};

// Create Bin Modal for Admin/Collector
const CreateBinModal = ({ isOpen, onClose, onSubmit, users, userType, currentUser }) => {
  const [formData, setFormData] = useState({
    binId: '',
    owner: userType === 'collector' ? currentUser._id : '',
    deviceType: 'rfid_tag',
    deviceId: '',
    binType: 'general',
    capacity: {
      total: 120,
      unit: 'liters'
    },
    location: {
      coordinates: ['', ''],
      address: ''
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const binData = {
      ...formData,
      capacity: {
        total: parseFloat(formData.capacity.total),
        unit: formData.capacity.unit,
        current: 0
      },
      location: {
        type: 'Point',
        coordinates: [parseFloat(formData.location.coordinates[1]), parseFloat(formData.location.coordinates[0])], // [lng, lat]
        address: formData.location.address
      }
    };

    onSubmit(binData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Waste Bin</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bin ID</label>
                <input
                  type="text"
                  value={formData.binId}
                  onChange={(e) => setFormData(prev => ({ ...prev, binId: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., BIN-001"
                  required
                />
              </div>

              {userType === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner</label>
                  <select
                    value={formData.owner}
                    onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select Owner</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email}) - {user.userType}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Device Type</label>
                <select
                  value={formData.deviceType}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceType: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="rfid_tag">RFID Tag</option>
                  <option value="barcode">Barcode</option>
                  <option value="smart_sensor">Smart Sensor</option>
                  <option value="qr_code">QR Code</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Device ID</label>
                <input
                  type="text"
                  value={formData.deviceId}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., RFID-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bin Type</label>
                <select
                  value={formData.binType}
                  onChange={(e) => setFormData(prev => ({ ...prev, binType: e.target.value }))}
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
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={formData.capacity.total}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      capacity: { ...prev.capacity, total: e.target.value }
                    }))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    placeholder="120"
                    required
                    min="1"
                  />
                  <select
                    value={formData.capacity.unit}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      capacity: { ...prev.capacity, unit: e.target.value }
                    }))}
                    className="w-24 border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="liters">Liters</option>
                    <option value="kg">Kg</option>
                    <option value="cubic_meters">m³</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates[0]}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { 
                      ...prev.location, 
                      coordinates: [e.target.value, prev.location.coordinates[1]]
                    }
                  }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="6.9271"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates[1]}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { 
                      ...prev.location, 
                      coordinates: [prev.location.coordinates[0], e.target.value]
                    }
                  }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="79.8612"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                value={formData.location.address}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, address: e.target.value }
                }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows="2"
                placeholder="Street address, City, District"
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
                Create Bin
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Request Bin Modal for Residents/Business
const RequestBinModal = ({ isOpen, onClose, onSubmit, currentUser }) => {
  const [formData, setFormData] = useState({
    binType: 'general',
    preferredLocation: '',
    justification: '',
    contactPhone: currentUser?.phone || '',
    additionalNotes: ''
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request New Waste Bin</h3>
          <p className="text-sm text-gray-600 mb-4">
            Submit a request for a new waste bin. Our team will contact you within 2-3 business days to arrange installation.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Bin Type</label>
              <select
                value={formData.binType}
                onChange={(e) => setFormData(prev => ({ ...prev, binType: e.target.value }))}
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
              <label className="block text-sm font-medium text-gray-700">Preferred Location</label>
              <textarea
                value={formData.preferredLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredLocation: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows="3"
                placeholder="Describe the preferred location for the bin (e.g., front gate, side of building, etc.)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Justification</label>
              <textarea
                value={formData.justification}
                onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows="3"
                placeholder="Why do you need this bin? (e.g., household size, business needs, etc.)"
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
                placeholder="Phone number for installation coordination"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Notes (Optional)</label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows="2"
                placeholder="Any additional information or special requirements..."
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
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WasteBins;