import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, truckAPI, routeAPI } from '../../utils/api';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  TruckIcon,
  MapIcon,
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CollectorProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignedTruck, setAssignedTruck] = useState(null);
  const [assignedRoutes, setAssignedRoutes] = useState([]);
  const [collectorStats, setCollectorStats] = useState({
    totalCollections: 0,
    completionRate: 0,
    averageRating: 0,
    totalDistance: 0
  });
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    collectorInfo: {
      employeeId: user?.collectorInfo?.employeeId || '',
      licenseNumber: user?.collectorInfo?.licenseNumber || '',
      experienceYears: user?.collectorInfo?.experienceYears || 0,
      specializations: user?.collectorInfo?.specializations || [],
      workingHours: {
        start: user?.collectorInfo?.workingHours?.start || '08:00',
        end: user?.collectorInfo?.workingHours?.end || '17:00'
      }
    }
  });

  useEffect(() => {
    fetchCollectorData();
  }, [user]);

  const fetchCollectorData = async () => {
    try {
      // Fetch assigned truck
      if (user?.collectorInfo?.assignedTruck) {
        const truckResponse = await truckAPI.getTruck(user.collectorInfo.assignedTruck);
        setAssignedTruck(truckResponse.data.truck);
      }

      // Fetch assigned routes
      if (user?.collectorInfo?.assignedRoutes?.length > 0) {
        const routePromises = user.collectorInfo.assignedRoutes.map(routeId => 
          routeAPI.getRoute(routeId)
        );
        const routeResponses = await Promise.all(routePromises);
        setAssignedRoutes(routeResponses.map(response => response.data.route));
      }

      // Fetch collector statistics (mock data for now)
      setCollectorStats({
        totalCollections: 847,
        completionRate: 98.5,
        averageRating: 4.7,
        totalDistance: 2450
      });

    } catch (error) {
      console.error('Failed to fetch collector data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSpecializationChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      collectorInfo: {
        ...prev.collectorInfo,
        specializations: checked 
          ? [...prev.collectorInfo.specializations, value]
          : prev.collectorInfo.specializations.filter(spec => spec !== value)
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await userAPI.updateProfile(formData);
      
      updateUserProfile(response.data.user);
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      collectorInfo: {
        employeeId: user?.collectorInfo?.employeeId || '',
        licenseNumber: user?.collectorInfo?.licenseNumber || '',
        experienceYears: user?.collectorInfo?.experienceYears || 0,
        specializations: user?.collectorInfo?.specializations || [],
        workingHours: {
          start: user?.collectorInfo?.workingHours?.start || '08:00',
          end: user?.collectorInfo?.workingHours?.end || '17:00'
        }
      }
    });
    setIsEditing(false);
  };

  const wasteTypeOptions = [
    { value: 'general', label: 'General Waste' },
    { value: 'recyclable', label: 'Recyclable' },
    { value: 'organic', label: 'Organic' },
    { value: 'hazardous', label: 'Hazardous' },
    { value: 'electronic', label: 'Electronic' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Collector Profile</h1>
              <p className="text-gray-600">Manage your collector information and work details</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Profile Avatar & Stats */}
            <div className="lg:col-span-1">
              <div className="text-center">
                <div className="mx-auto h-32 w-32 bg-green-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-16 w-16 text-green-600" />
                </div>
                <h2 className="mt-4 text-xl font-medium text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500">Waste Collector</p>
                <p className="text-sm text-gray-500">ID: {user?.collectorInfo?.employeeId || 'Not Set'}</p>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 space-y-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Collections</p>
                      <p className="text-lg font-bold text-blue-600">{collectorStats.totalCollections}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <StarIcon className="h-5 w-5 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Rating</p>
                      <p className="text-lg font-bold text-green-600">{collectorStats.averageRating}/5</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <MapIcon className="h-5 w-5 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-900">Distance</p>
                      <p className="text-lg font-bold text-yellow-600">{collectorStats.totalDistance} km</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-3 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="collectorInfo.employeeId"
                        value={formData.collectorInfo.employeeId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.collectorInfo?.employeeId || 'Not Set'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="collectorInfo.licenseNumber"
                        value={formData.collectorInfo.licenseNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.collectorInfo?.licenseNumber || 'Not Set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        name="collectorInfo.experienceYears"
                        value={formData.collectorInfo.experienceYears}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.collectorInfo?.experienceYears || 0} years</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                    {isEditing ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {wasteTypeOptions.map((option) => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="checkbox"
                              value={option.value}
                              checked={formData.collectorInfo.specializations.includes(option.value)}
                              onChange={handleSpecializationChange}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {user?.collectorInfo?.specializations?.length > 0 ? 
                          user.collectorInfo.specializations.map((spec) => (
                            <span key={spec} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {wasteTypeOptions.find(opt => opt.value === spec)?.label || spec}
                            </span>
                          )) : 
                          <p className="text-gray-500 text-sm">No specializations set</p>
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <ClockIcon className="h-5 w-5 inline mr-2" />
                  Working Hours
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    {isEditing ? (
                      <input
                        type="time"
                        name="collectorInfo.workingHours.start"
                        value={formData.collectorInfo.workingHours.start}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.collectorInfo?.workingHours?.start || '08:00'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    {isEditing ? (
                      <input
                        type="time"
                        name="collectorInfo.workingHours.end"
                        value={formData.collectorInfo.workingHours.end}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.collectorInfo?.workingHours?.end || '17:00'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Truck */}
              {assignedTruck && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    <TruckIcon className="h-5 w-5 inline mr-2" />
                    Assigned Truck
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Truck Number:</span>
                        <p className="text-gray-900">{assignedTruck.truckNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium">Type:</span>
                        <p className="text-gray-900 capitalize">{assignedTruck.vehicleType}</p>
                      </div>
                      <div>
                        <span className="font-medium">Capacity:</span>
                        <p className="text-gray-900">{assignedTruck.capacity?.weight || assignedTruck.capacity?.volume || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignedTruck.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {assignedTruck.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assigned Routes */}
              {assignedRoutes.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    <MapIcon className="h-5 w-5 inline mr-2" />
                    Assigned Routes ({assignedRoutes.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedRoutes.map((route) => (
                      <div key={route._id} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{route.name}</h4>
                        <p className="text-sm text-gray-600">{route.district} - {route.cities?.startCity} to {route.cities?.endCity}</p>
                        <p className="text-sm text-gray-500">{route.wasteBins?.length || 0} bins</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                          route.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {route.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectorProfile;