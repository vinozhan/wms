import React, { useState, useEffect } from 'react';
import { XMarkIcon, MapIcon, TruckIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline';
import { routeAPI, userAPI, wasteBinAPI, locationAPI, truckAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const AddRouteModal = ({ isOpen, onClose, onRouteAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    district: 'colombo',
    cities: {
      startCity: '',
      endCity: '',
      intermediateCities: []
    },
    assignedCollector: '',
    backupCollector: '',
    vehicle: {
      vehicleId: '',
      type: 'truck',
      capacity: '',
      fuelType: 'diesel'
    },
    wasteBins: [],
    schedule: {
      frequency: 'weekly',
      daysOfWeek: [],
      startTime: '08:00',
      endTime: '17:00',
      estimatedDuration: 480
    }
  });

  const [loading, setLoading] = useState(false);
  const [collectors, setCollectors] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableBins, setAvailableBins] = useState([]);
  const [selectedBins, setSelectedBins] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchCollectors();
      fetchCitiesByDistrict('colombo');
      fetchAvailableBins();
    }
  }, [isOpen]);

  // Auto-fill vehicle details when collector is selected
  useEffect(() => {
    if (formData.assignedCollector) {
      fillVehicleDetailsFromCollector(formData.assignedCollector);
    }
  }, [formData.assignedCollector]);

  const fetchCollectors = async () => {
    try {
      const response = await userAPI.getUsers({ userType: 'collector', limit: 100 });
      setCollectors(response.data.users);
    } catch (error) {
      console.error('Failed to fetch collectors:', error);
      toast.error('Failed to fetch collectors');
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

  const fetchAvailableBins = async () => {
    try {
      const response = await wasteBinAPI.getWasteBins({ status: 'active', limit: 100 });
      setAvailableBins(response.data.wasteBins || []);
    } catch (error) {
      console.error('Failed to fetch waste bins:', error);
      setAvailableBins([]);
    }
  };

  const fillVehicleDetailsFromCollector = async (collectorId) => {
    try {
      // Find the collector from the collectors list
      const selectedCollector = collectors.find(c => c._id === collectorId);
      
      if (selectedCollector?.collectorInfo?.assignedTruck) {
        // Fetch truck details
        const truckResponse = await truckAPI.getTruck(selectedCollector.collectorInfo.assignedTruck);
        const truck = truckResponse.data.truck;
        
        // Auto-fill vehicle fields with truck data
        setFormData(prev => ({
          ...prev,
          vehicle: {
            vehicleId: truck.truckNumber || '',
            type: truck.vehicleType || 'truck',
            capacity: truck.capacity?.weight || truck.capacity?.volume || '',
            fuelType: truck.specifications?.engineType || 'diesel'
          }
        }));
        
        // toast.success(`Vehicle details auto-filled from ${selectedCollector.name}'s assigned truck (${truck.truckNumber})`);
      } else {
        // Clear vehicle fields if collector has no assigned truck
        setFormData(prev => ({
          ...prev,
          vehicle: {
            vehicleId: '',
            type: 'truck',
            capacity: '',
            fuelType: 'diesel'
          }
        }));
        
        if (selectedCollector) {
          toast.info(`${selectedCollector.name} has no assigned truck. Please set vehicle requirements manually.`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch truck details:', error);
      // Don't show error toast as this is an enhancement feature
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

  const handleIntermediateCityChange = (e) => {
    const { value, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      cities: {
        ...prev.cities,
        intermediateCities: checked 
          ? [...prev.cities.intermediateCities, value]
          : prev.cities.intermediateCities.filter(city => city !== value)
      }
    }));
  };

  const handleBinSelection = (binId, checked) => {
    if (checked) {
      const bin = availableBins.find(b => b._id === binId);
      const newBinData = {
        bin: binId,
        sequenceOrder: selectedBins.length + 1,
        estimatedTime: 5,
        priority: 'medium'
      };
      setSelectedBins(prev => [...prev, { ...newBinData, binData: bin }]);
    } else {
      setSelectedBins(prev => prev.filter(b => b.bin !== binId));
    }
  };

  const updateBinOrder = (binId, newOrder) => {
    setSelectedBins(prev => 
      prev.map(b => 
        b.bin === binId ? { ...b, sequenceOrder: parseInt(newOrder) } : b
      ).sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    );
  };

  const updateBinPriority = (binId, priority) => {
    setSelectedBins(prev => 
      prev.map(b => 
        b.bin === binId ? { ...b, priority } : b
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.assignedCollector || !formData.cities.startCity || !formData.cities.endCity) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedBins.length === 0) {
      toast.error('Please select at least one waste bin for the route');
      return;
    }

    setLoading(true);
    
    try {
      const routeData = {
        ...formData,
        wasteBins: selectedBins.map(({ binData, ...bin }) => bin),
        vehicle: {
          ...formData.vehicle,
          capacity: parseFloat(formData.vehicle.capacity) || 0
        }
      };

      const response = await routeAPI.createRoute(routeData);
      
      toast.success('Route created successfully!');
      
      if (onRouteAdded) {
        onRouteAdded(response.data.route);
      }
      
      // Reset form
      setFormData({
        name: '',
        district: 'colombo',
        cities: {
          startCity: '',
          endCity: '',
          intermediateCities: []
        },
        assignedCollector: '',
        backupCollector: '',
        vehicle: {
          vehicleId: '',
          type: 'truck',
          capacity: '',
          fuelType: 'diesel'
        },
        wasteBins: [],
        schedule: {
          frequency: 'weekly',
          daysOfWeek: [],
          startTime: '08:00',
          endTime: '17:00',
          estimatedDuration: 480
        }
      });
      setSelectedBins([]);
      
      onClose();
    } catch (error) {
      console.error('Failed to create route:', error);
      toast.error(error.response?.data?.message || 'Failed to create route');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-5 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MapIcon className="h-6 w-6 mr-2 text-blue-600" />
            Create New Route
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
                Route Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Downtown Collection Route"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="colombo">Colombo</option>
              </select>
            </div>
          </div>

          {/* Route Cities */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Route Path</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start City *
                </label>
                <select
                  name="cities.startCity"
                  value={formData.cities.startCity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select start city</option>
                  {availableCities.map(city => (
                    <option key={city.value} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End City *
                </label>
                <select
                  name="cities.endCity"
                  value={formData.cities.endCity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select end city</option>
                  {availableCities.map(city => (
                    <option key={city.value} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intermediate Cities (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {availableCities.map(city => (
                  <label key={city.value} className="flex items-center">
                    <input
                      type="checkbox"
                      value={city.value}
                      checked={formData.cities.intermediateCities.includes(city.value)}
                      onChange={handleIntermediateCityChange}
                      className="mr-2"
                    />
                    <span className="text-sm">{city.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Collector Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Collector *
              </label>
              <select
                name="assignedCollector"
                value={formData.assignedCollector}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a collector</option>
                {collectors.map(collector => (
                  <option key={collector._id} value={collector._id}>
                    {collector.name} - {collector.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Backup Collector (Optional)
              </label>
              <select
                name="backupCollector"
                value={formData.backupCollector}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select backup collector</option>
                {collectors.map(collector => (
                  <option key={collector._id} value={collector._id}>
                    {collector.name} - {collector.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">Vehicle Requirements</h4>
              {formData.assignedCollector && formData.vehicle.vehicleId && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <TruckIcon className="h-4 w-4" />
                  <span>Auto-filled from collector's assigned truck</span>
                </div>
              )}
            </div>
            
            {formData.assignedCollector && !formData.vehicle.vehicleId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  The selected collector has no assigned truck. Please set vehicle requirements manually or assign a truck to the collector first.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle ID {formData.assignedCollector && formData.vehicle.vehicleId && "(Auto-filled)"}
                </label>
                <input
                  type="text"
                  name="vehicle.vehicleId"
                  value={formData.vehicle.vehicleId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formData.assignedCollector && formData.vehicle.vehicleId 
                      ? 'bg-green-50 text-green-800' 
                      : ''
                  }`}
                  placeholder="e.g., TRK-001"
                  readOnly={formData.assignedCollector && formData.vehicle.vehicleId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type {formData.assignedCollector && formData.vehicle.vehicleId && "(Auto-filled)"}
                </label>
                <select
                  name="vehicle.type"
                  value={formData.vehicle.type}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formData.assignedCollector && formData.vehicle.vehicleId 
                      ? 'bg-green-50 text-green-800' 
                      : ''
                  }`}
                  disabled={formData.assignedCollector && formData.vehicle.vehicleId}
                >
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  <option value="electric_vehicle">Electric Vehicle</option>
                  <option value="compactor">Compactor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity {formData.assignedCollector && formData.vehicle.vehicleId && "(Auto-filled)"}
                </label>
                <input
                  type="number"
                  name="vehicle.capacity"
                  value={formData.vehicle.capacity}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formData.assignedCollector && formData.vehicle.vehicleId 
                      ? 'bg-green-50 text-green-800' 
                      : ''
                  }`}
                  placeholder="e.g., 5"
                  min="0"
                  step="0.1"
                  readOnly={formData.assignedCollector && formData.vehicle.vehicleId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type {formData.assignedCollector && formData.vehicle.vehicleId && "(Auto-filled)"}
                </label>
                <select
                  name="vehicle.fuelType"
                  value={formData.vehicle.fuelType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formData.assignedCollector && formData.vehicle.vehicleId 
                      ? 'bg-green-50 text-green-800' 
                      : ''
                  }`}
                  disabled={formData.assignedCollector && formData.vehicle.vehicleId}
                >
                  <option value="diesel">Diesel</option>
                  <option value="petrol">Petrol</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Schedule</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  name="schedule.frequency"
                  value={formData.schedule.frequency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi_weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="schedule.startTime"
                  value={formData.schedule.startTime}
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
                  name="schedule.endTime"
                  value={formData.schedule.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="schedule.estimatedDuration"
                  value={formData.schedule.estimatedDuration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      value={day}
                      checked={formData.schedule.daysOfWeek.includes(day)}
                      onChange={handleInputChange}
                      name="schedule.daysOfWeek"
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Waste Bins Selection */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Waste Bins Selection *</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Bins
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
                  {availableBins.map(bin => (
                    <label key={bin._id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={selectedBins.some(b => b.bin === bin._id)}
                        onChange={(e) => handleBinSelection(bin._id, e.target.checked)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{bin.binId}</div>
                        <div className="text-xs text-gray-500">
                          {bin.binType} - {bin.location?.address}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Route ({selectedBins.length} bins)
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
                  {selectedBins.map((binInfo, index) => (
                    <div key={binInfo.bin} className="mb-3 p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">{binInfo.binData?.binId}</div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <label className="text-xs text-gray-500">Order</label>
                          <input
                            type="number"
                            value={binInfo.sequenceOrder}
                            onChange={(e) => updateBinOrder(binInfo.bin, e.target.value)}
                            className="w-full text-xs px-1 py-1 border rounded"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Priority</label>
                          <select
                            value={binInfo.priority}
                            onChange={(e) => updateBinPriority(binInfo.bin, e.target.value)}
                            className="w-full text-xs px-1 py-1 border rounded"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

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
              {loading ? 'Creating...' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRouteModal;