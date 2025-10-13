import React, { useState } from 'react';
import {
  TrashIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Thermometer, Droplets, BarChart3, Recycle } from 'lucide-react';
import { Modal, StatusBadge, ProgressBar } from '../common';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const BinDetailsModal = ({ bin, isOpen, onClose, onUpdateFillLevel }) => {
  const { user } = useAuth();
  const [isEditingFillLevel, setIsEditingFillLevel] = useState(false);
  const [newFillLevel, setNewFillLevel] = useState(bin?.sensorData?.fillLevel || 0);
  if (!bin) return null;

  // Users can edit fill levels for their own bins, collectors and admins can edit any bin
  const canEditFillLevel = user && ['resident', 'business', 'collector', 'admin'].includes(user.userType);

  const handleSaveFillLevel = async () => {
    if (newFillLevel < 0 || newFillLevel > 100) {
      toast.error('Fill level must be between 0 and 100%');
      return;
    }

    try {
      if (onUpdateFillLevel) {
        await onUpdateFillLevel(bin._id, newFillLevel);
        toast.success('Fill level updated successfully');
      }
      setIsEditingFillLevel(false);
    } catch (error) {
      toast.error('Failed to update fill level');
    }
  };

  const handleCancelEdit = () => {
    setNewFillLevel(bin?.sensorData?.fillLevel || 0);
    setIsEditingFillLevel(false);
  };
  
  const getBinTypeIcon = (binType) => {
    switch (binType) {
      case 'recyclable':
        return <Recycle className="h-8 w-8 text-green-600" />;
      case 'organic':
        return <TrashIcon className="h-8 w-8 text-brown-600" />;
      case 'hazardous':
        return <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />;
      case 'electronic':
        return <BarChart3 className="h-8 w-8 text-blue-600" />;
      default:
        return <TrashIcon className="h-8 w-8 text-gray-600" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <div className="flex items-center mb-6">
          {getBinTypeIcon(bin.binType)}
          <div className="ml-3">
            <h3 className="text-xl font-bold text-gray-900">{bin.binId}</h3>
            <p className="text-sm text-gray-500 capitalize">{bin.binType} Waste Bin</p>
          </div>
          <div className="ml-auto">
            <StatusBadge 
              status={bin.status} 
              fillLevel={bin.sensorData?.fillLevel} 
              type="bin" 
            />
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status & Fill Level */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-900">Status & Capacity</h4>
            {canEditFillLevel && !isEditingFillLevel && (
              <button
                onClick={() => setIsEditingFillLevel(true)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded"
                title="Edit fill level"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {isEditingFillLevel ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manual Fill Level Entry
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newFillLevel}
                    onChange={(e) => setNewFillLevel(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter fill level (0-100)"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveFillLevel}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                    title="Save"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                    title="Cancel"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <ProgressBar 
                  value={newFillLevel}
                  label="Preview Fill Level"
                  size="lg"
                />
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <ProgressBar 
                value={bin.sensorData?.fillLevel || 0}
                label="Fill Level"
                size="lg"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Capacity:</span>
              <span className="text-sm font-medium">
                {bin.capacity?.current || 0} / {bin.capacity?.total} {bin.capacity?.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className="text-sm font-medium capitalize">{bin.status}</span>
            </div>
          </div>
        </div>

        {/* Location & Device Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Location & Device</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-start">
                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <span className="text-sm text-gray-600">Address:</span>
                  <p className="text-sm font-medium">{bin.location?.address}</p>
                </div>
              </div>
            </div>
            
            {bin.location?.coordinates && (
              <div>
                <span className="text-sm text-gray-600">Coordinates:</span>
                <p className="text-sm">
                  {bin.location.coordinates[1]}, {bin.location.coordinates[0]}
                </p>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-600">Device Type:</span>
              <span className="text-sm font-medium ml-2 capitalize">{bin.deviceType}</span>
            </div>

            <div>
              <span className="text-sm text-gray-600">Device ID:</span>
              <span className="text-sm font-medium ml-2">{bin.deviceId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Data */}
      {bin.sensorData && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Sensor Data</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bin.sensorData.temperature && (
              <div className="text-center">
                <Thermometer className="h-6 w-6 text-red-400 mx-auto mb-1" />
                <span className="text-sm font-medium">{bin.sensorData.temperature}°C</span>
                <p className="text-xs text-gray-500">Temperature</p>
              </div>
            )}
            {bin.sensorData.humidity && (
              <div className="text-center">
                <Droplets className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                <span className="text-sm font-medium">{bin.sensorData.humidity}%</span>
                <p className="text-xs text-gray-500">Humidity</p>
              </div>
            )}
            <div className="text-center">
              <BarChart3 className="h-6 w-6 text-green-400 mx-auto mb-1" />
              <span className="text-sm font-medium">{bin.sensorData?.fillLevel || 0}%</span>
              <p className="text-xs text-gray-500">
                Fill Level
                <span className="text-blue-500 ml-1">(Editable)</span>
              </p>
            </div>
            <div className="text-center">
              <ClockIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <span className="text-sm font-medium">
                {formatTime(bin.sensorData?.lastUpdated)}
              </span>
              <p className="text-xs text-gray-500">Last Update</p>
            </div>
          </div>
        </div>
      )}

      {/* Collection History */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Collection Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Last Collection:</span>
            <p className="text-sm font-medium">
              {formatDate(bin.lastCollection?.date)}
            </p>
            {bin.lastCollection?.collector && (
              <p className="text-xs text-gray-500 mt-1">
                by {bin.lastCollection.collector}
              </p>
            )}
          </div>
          <div>
            <span className="text-sm text-gray-600">Next Scheduled:</span>
            <p className="text-sm font-medium text-green-600">
              {formatDate(bin.nextScheduledCollection)}
            </p>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      {bin.owner && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Owner Information</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm">{bin.owner.name}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm ml-2">{bin.owner.email}</span>
            </div>
            {bin.owner.phone && (
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm">{bin.owner.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <div className="text-xs text-gray-500">
          <span>💡 You can manually update the fill level by clicking the edit icon</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default BinDetailsModal;