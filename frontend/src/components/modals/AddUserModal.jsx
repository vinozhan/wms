import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, TruckIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline';
import { userAPI, truckAPI, locationAPI } from '../../utils/api';
import AddTruckModal from './AddTruckModal';
import toast from 'react-hot-toast';

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    userType: 'resident',
    address: {
      street: '',
      city: '',
      district: 'colombo',
      postalCode: '',
      coordinates: {
        latitude: 6.9271,
        longitude: 79.8612
      }
    },
    // Collector-specific fields
    collectorInfo: {
      assignedTruck: '',
      assignedCities: [],
      workSchedule: {
        daysOfWeek: [],
        startTime: '08:00',
        endTime: '17:00'
      },
      specializations: []
    }
  });

  const [loading, setLoading] = useState(false);
  const [showAddTruckModal, setShowAddTruckModal] = useState(false);
  const [availableTrucks, setAvailableTrucks] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchDistricts();
      fetchAvailableTrucks();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.address.district) {
      fetchCitiesByDistrict(formData.address.district);
    }
  }, [formData.address.district]);

  const fetchDistricts = async () => {
    try {
      const response = await locationAPI.getDistricts();
      setDistricts(response.data.districts);
    } catch (error) {
      console.error('Failed to fetch districts:', error);
    }
  };

  const fetchCitiesByDistrict = async (district) => {
    try {
      const response = await locationAPI.getCitiesByDistrict(district);
      setAvailableCities(response.data.cities);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
      setAvailableCities([]);
    }
  };

  const fetchAvailableTrucks = async () => {
    try {
      const response = await truckAPI.getAvailableTrucks();
      setAvailableTrucks(response.data.trucks);
    } catch (error) {
      console.error('Failed to fetch trucks:', error);
      setAvailableTrucks([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        
        if (type === 'checkbox') {
          if (checked) {
            current[keys[keys.length - 1]] = [...(current[keys[keys.length - 1]] || []), value];
          } else {
            current[keys[keys.length - 1]] = (current[keys[keys.length - 1]] || []).filter(item => item !== value);
          }
        } else {
          current[keys[keys.length - 1]] = value;
        }
        
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleMultiSelectChange = (e, fieldName) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      const currentArray = prev.collectorInfo[fieldName] || [];
      return {
        ...prev,
        collectorInfo: {
          ...prev.collectorInfo,
          [fieldName]: checked 
            ? [...currentArray, value]
            : currentArray.filter(item => item !== value)
        }
      };
    });
  };

  const handleWorkScheduleChange = (e, fieldName) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      const currentArray = prev.collectorInfo.workSchedule[fieldName] || [];
      return {
        ...prev,
        collectorInfo: {
          ...prev.collectorInfo,
          workSchedule: {
            ...prev.collectorInfo.workSchedule,
            [fieldName]: checked 
              ? [...currentArray, value]
              : currentArray.filter(item => item !== value)
          }
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        userType: formData.userType,
        address: {
          ...formData.address,
          coordinates: {
            latitude: parseFloat(formData.address.coordinates.latitude),
            longitude: parseFloat(formData.address.coordinates.longitude)
          }
        }
      };

      // Add collector-specific data if user is a collector
      if (formData.userType === 'collector') {
        userData.collectorInfo = formData.collectorInfo;
      }

      const response = await userAPI.createUser(userData);
      
      // If collector has assigned truck, link them
      if (formData.userType === 'collector' && formData.collectorInfo.assignedTruck) {
        try {
          await truckAPI.assignTruckToCollector(
            formData.collectorInfo.assignedTruck, 
            response.data.user._id
          );
        } catch (truckError) {
          console.error('Failed to assign truck:', truckError);
          toast.error('User created but truck assignment failed');
        }
      }
      
      toast.success(`${formData.userType} added successfully!`);
      
      if (onUserAdded) {
        onUserAdded(response.data.user);
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        userType: 'resident',
        address: {
          street: '',
          city: '',
          district: 'colombo',
          postalCode: '',
          coordinates: {
            latitude: 6.9271,
            longitude: 79.8612
          }
        },
        collectorInfo: {
          assignedTruck: '',
          assignedCities: [],
          workSchedule: {
            daysOfWeek: [],
            startTime: '08:00',
            endTime: '17:00'
          },
          specializations: []
        }
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error(error.response?.data?.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleTruckAdded = (newTruck) => {
    setAvailableTrucks(prev => [...prev, newTruck]);
    setFormData(prev => ({
      ...prev,
      collectorInfo: {
        ...prev.collectorInfo,
        assignedTruck: newTruck._id
      }
    }));
  };

  if (!isOpen) return null;

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const wasteTypes = ['general', 'recyclable', 'organic', 'hazardous', 'electronic'];

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <UserIcon className="h-6 w-6 mr-2 text-blue-600" />
              Add New User
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Type *
                </label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="resident">Resident</option>
                  <option value="business">Business</option>
                  <option value="collector">Collector</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Address Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <select
                    name="address.district"
                    value={formData.address.district}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {districts.map(district => (
                      <option key={district.value} value={district.value}>
                        {district.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <select
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a city</option>
                    {availableCities.map(city => (
                      <option key={city.value} value={city.value}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="address.coordinates.latitude"
                    value={formData.address.coordinates.latitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="address.coordinates.longitude"
                    value={formData.address.coordinates.longitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Collector-specific fields */}
            {formData.userType === 'collector' && (
              <div className="space-y-4 border-t pt-6">
                <h4 className="text-md font-medium text-gray-900">Collector Information</h4>
                
                {/* Truck Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Truck
                  </label>
                  <div className="flex space-x-2">
                    <select
                      name="collectorInfo.assignedTruck"
                      value={formData.collectorInfo.assignedTruck}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a truck</option>
                      {availableTrucks.map(truck => (
                        <option key={truck._id} value={truck._id}>
                          {truck.truckNumber} - {truck.vehicleType}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAddTruckModal(true)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add New Truck
                    </button>
                  </div>
                </div>

                {/* Assigned Cities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Cities (Multi-select)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {availableCities.map(city => (
                      <label key={city.value} className="flex items-center">
                        <input
                          type="checkbox"
                          value={city.value}
                          checked={formData.collectorInfo.assignedCities.includes(city.value)}
                          onChange={(e) => handleMultiSelectChange(e, 'assignedCities')}
                          className="mr-2"
                        />
                        <span className="text-sm">{city.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Work Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Days
                    </label>
                    <div className="space-y-1">
                      {daysOfWeek.map(day => (
                        <label key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            value={day}
                            checked={formData.collectorInfo.workSchedule.daysOfWeek.includes(day)}
                            onChange={(e) => handleWorkScheduleChange(e, 'daysOfWeek')}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="collectorInfo.workSchedule.startTime"
                      value={formData.collectorInfo.workSchedule.startTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      name="collectorInfo.workSchedule.endTime"
                      value={formData.collectorInfo.workSchedule.endTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waste Type Specializations
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {wasteTypes.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          value={type}
                          checked={formData.collectorInfo.specializations.includes(type)}
                          onChange={(e) => handleMultiSelectChange(e, 'specializations')}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-sm text-white rounded-md ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Truck Modal */}
      <AddTruckModal
        isOpen={showAddTruckModal}
        onClose={() => setShowAddTruckModal(false)}
        onTruckAdded={handleTruckAdded}
      />
    </>
  );
};

export default AddUserModal;