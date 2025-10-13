import React, { useState, useEffect } from 'react';
import { CalendarIcon, MapPinIcon, TruckIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { userAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ScheduleCollectionModal = ({ isOpen, onClose, onSubmit, selectedBin }) => {
  const [formData, setFormData] = useState({
    collector: '',
    scheduledDate: '',
    scheduledTime: '',
    wasteType: '',
    priority: 'normal',
    notes: ''
  });

  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && selectedBin) {
      fetchCollectors();
      // Pre-populate with bin data
      setFormData(prev => ({
        ...prev,
        wasteType: selectedBin.binType,
        priority: selectedBin.sensorData?.fillLevel >= 80 ? 'urgent' : 
                 selectedBin.sensorData?.fillLevel >= 60 ? 'high' : 'normal'
      }));
    }
  }, [isOpen, selectedBin]);

  const fetchCollectors = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers({ userType: 'collector' });
      setCollectors(response.data.users);
    } catch (error) {
      console.error('Failed to fetch collectors:', error);
      toast.error('Failed to load collectors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.collector || !formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    
    if (scheduledDateTime <= new Date()) {
      toast.error('Scheduled time must be in the future');
      return;
    }
    
    const collectionData = {
      wasteBin: selectedBin._id,
      collector: formData.collector,
      scheduledDate: scheduledDateTime.toISOString(),
      wasteData: {
        wasteType: formData.wasteType,
        priority: formData.priority
      },
      location: {
        coordinates: selectedBin.location?.coordinates || [0, 0],
        address: selectedBin.location?.address
      },
      verification: {
        method: 'scheduled_collection'
      },
      notes: {
        adminNotes: formData.notes
      },
      status: 'scheduled'
    };

    try {
      await onSubmit(collectionData);
      // Reset form
      setFormData({
        collector: '',
        scheduledDate: '',
        scheduledTime: '',
        wasteType: selectedBin?.binType || '',
        priority: 'normal',
        notes: ''
      });
      onClose();
      toast.success('Collection scheduled successfully!');
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

  if (!isOpen || !selectedBin) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Schedule Collection</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Bin Info Header */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Bin</h4>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{selectedBin.binId}</p>
              <p className="text-sm text-gray-600 capitalize">{selectedBin.binType} waste</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Fill Level: {selectedBin.sensorData?.fillLevel || 0}%</p>
              <p className="text-sm text-gray-600">{selectedBin.location?.address}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Owner: {selectedBin.owner?.name}</p>
              <p className="text-sm text-gray-600">Status: <span className="capitalize">{selectedBin.status}</span></p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Collector Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Assign Collector *
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
                  Collection Date *
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
                  Collection Time *
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
                  disabled
                >
                  <option value="general">General Waste</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="organic">Organic</option>
                  <option value="hazardous">Hazardous</option>
                  <option value="electronic">Electronic</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Pre-filled from bin type</p>
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
                <p className="text-xs text-gray-500 mt-1">
                  {selectedBin.sensorData?.fillLevel >= 80 ? 'Recommended: Urgent (>80% full)' :
                   selectedBin.sensorData?.fillLevel >= 60 ? 'Recommended: High (>60% full)' :
                   'Recommended: Normal'}
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Special instructions, access codes, etc..."
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