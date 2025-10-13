import React, { useState, useEffect } from 'react';
import { CalendarIcon, MapPinIcon, TruckIcon, UserIcon } from '@heroicons/react/24/outline';
import { wasteBinAPI, userAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ScheduleCollectionModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    wasteBin: '',
    collector: '',
    scheduledDate: '',
    scheduledTime: '',
    wasteType: 'general',
    priority: 'normal',
    notes: ''
  });

  const [wasteBins, setWasteBins] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [binsResponse, usersResponse] = await Promise.all([
        wasteBinAPI.getWasteBins(),
        userAPI.getUsers({ userType: 'collector' })
      ]);
      
      setWasteBins(binsResponse.data.wasteBins);
      setCollectors(usersResponse.data.users);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.wasteBin || !formData.collector || !formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    
    const collectionData = {
      wasteBin: formData.wasteBin,
      collector: formData.collector,
      scheduledDate: scheduledDateTime.toISOString(),
      wasteData: {
        wasteType: formData.wasteType,
        priority: formData.priority
      },
      location: {
        coordinates: [0, 0] // Default coordinates, will be updated during actual collection
      },
      verification: {
        method: 'manual_entry' // Default method for scheduled collections
      },
      notes: {
        adminNotes: formData.notes
      }
    };

    try {
      await onSubmit(collectionData);
      // Reset form
      setFormData({
        wasteBin: '',
        collector: '',
        scheduledDate: '',
        scheduledTime: '',
        wasteType: 'general',
        priority: 'normal',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to schedule collection:', error);
      toast.error('Failed to schedule collection');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Schedule Collection</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Waste Bin Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TruckIcon className="h-4 w-4 inline mr-1" />
                Waste Bin *
              </label>
              <select
                name="wasteBin"
                value={formData.wasteBin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a waste bin</option>
                {wasteBins.map((bin) => (
                  <option key={bin._id} value={bin._id}>
                    {bin.binId} - {bin.binType} ({bin.owner?.name}) - {bin.location?.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Collector Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Collector *
              </label>
              <select
                name="collector"
                value={formData.collector}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a collector</option>
                {collectors.map((collector) => (
                  <option key={collector._id} value={collector._id}>
                    {collector.name} - {collector.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Date *
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Waste Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waste Type
                </label>
                <select
                  name="wasteType"
                  value={formData.wasteType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">General Waste</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="organic">Organic</option>
                  <option value="hazardous">Hazardous</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any special instructions or notes..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
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
        )}
      </div>
    </div>
  );
};

export default ScheduleCollectionModal;