import React, { useState } from 'react';
import { XMarkIcon, TruckIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { truckAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const AddTruckModal = ({ isOpen, onClose, onTruckAdded }) => {
  const [formData, setFormData] = useState({
    truckNumber: '',
    vehicleType: 'truck',
    capacity: {
      volume: '',
      weight: '',
      unit: 'cubic_meters'
    },
    specifications: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      engineType: 'diesel',
      fuelCapacity: ''
    },
    baseLocation: {
      address: '',
      coordinates: [0, 0]
    }
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.truckNumber || !formData.capacity.volume || !formData.capacity.weight) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const truckData = {
        ...formData,
        capacity: {
          ...formData.capacity,
          volume: parseFloat(formData.capacity.volume),
          weight: parseFloat(formData.capacity.weight)
        },
        specifications: {
          ...formData.specifications,
          year: parseInt(formData.specifications.year),
          fuelCapacity: formData.specifications.fuelCapacity ? parseFloat(formData.specifications.fuelCapacity) : undefined
        }
      };

      const response = await truckAPI.createTruck(truckData);
      
      toast.success('Truck added successfully!');
      
      // Call the callback with the new truck data
      if (onTruckAdded) {
        onTruckAdded(response.data.truck);
      }
      
      // Reset form
      setFormData({
        truckNumber: '',
        vehicleType: 'truck',
        capacity: {
          volume: '',
          weight: '',
          unit: 'cubic_meters'
        },
        specifications: {
          make: '',
          model: '',
          year: new Date().getFullYear(),
          engineType: 'diesel',
          fuelCapacity: ''
        },
        baseLocation: {
          address: '',
          coordinates: [0, 0]
        }
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to create truck:', error);
      toast.error(error.response?.data?.message || 'Failed to add truck');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <TruckIcon className="h-6 w-6 mr-2 text-blue-600" />
            Add New Truck
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
                Truck Number *
              </label>
              <input
                type="text"
                name="truckNumber"
                value={formData.truckNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., WM-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type *
              </label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="electric_vehicle">Electric Vehicle</option>
                <option value="compactor">Compactor</option>
              </select>
            </div>
          </div>

          {/* Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume Capacity *
              </label>
              <input
                type="number"
                name="capacity.volume"
                value={formData.capacity.volume}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 10"
                min="1"
                step="0.1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight Capacity *
              </label>
              <input
                type="number"
                name="capacity.weight"
                value={formData.capacity.weight}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 5000"
                min="1"
                step="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                name="capacity.unit"
                value={formData.capacity.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cubic_meters">Cubic Meters</option>
                <option value="liters">Liters</option>
              </select>
            </div>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Make
              </label>
              <input
                type="text"
                name="specifications.make"
                value={formData.specifications.make}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Toyota"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                name="specifications.model"
                value={formData.specifications.model}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Hiace"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                name="specifications.year"
                value={formData.specifications.year}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Engine Type
              </label>
              <select
                name="specifications.engineType"
                value={formData.specifications.engineType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Fuel Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Capacity (Liters)
              </label>
              <input
                type="number"
                name="specifications.fuelCapacity"
                value={formData.specifications.fuelCapacity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 60"
                min="1"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Location
              </label>
              <input
                type="text"
                name="baseLocation.address"
                value={formData.baseLocation.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Main Depot, Colombo"
              />
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
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Adding...' : 'Add Truck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTruckModal;