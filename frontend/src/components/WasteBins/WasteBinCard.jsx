import React from 'react';
import { 
  TrashIcon, 
  MapPinIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { Thermometer, Droplets, BarChart3, Recycle } from 'lucide-react';
import { StatusBadge, ProgressBar } from '../common';

const WasteBinCard = ({ 
  bin, 
  onRequestCollection, 
  onScheduleCollection,
  onViewDetails,
  hasPendingRequest = false,
  collectionStatus = null,
  userType
}) => {
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

  const getScheduleButtonConfig = () => {
    if (collectionStatus === 'scheduled') {
      return {
        text: 'Collection Scheduled',
        className: 'bg-green-500 text-white cursor-not-allowed',
        disabled: true,
        icon: <CalendarDaysIcon className="h-4 w-4 mr-1" />
      };
    } else if (collectionStatus === 'in_progress') {
      return {
        text: 'Collection In Progress',
        className: 'bg-yellow-500 text-white cursor-not-allowed',
        disabled: true,
        icon: <CalendarDaysIcon className="h-4 w-4 mr-1" />
      };
    } else if (hasPendingRequest) {
      return {
        text: userType === 'collector' ? 'Already Scheduled' : 'Request Pending',
        className: 'bg-gray-300 text-gray-500 cursor-not-allowed',
        disabled: true,
        icon: <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
      };
    } else {
      // Default state - can schedule
      if (userType === 'resident' || userType === 'business') {
        return {
          text: 'Request Collection',
          className: 'bg-blue-600 text-white hover:bg-blue-700',
          disabled: false,
          icon: <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
        };
      } else if (userType === 'collector') {
        return {
          text: 'Schedule Collection',
          className: 'bg-orange-600 text-white hover:bg-orange-700',
          disabled: false,
          icon: <CalendarDaysIcon className="h-4 w-4 mr-1" />
        };
      } else {
        // Admin
        return {
          text: 'Manage Collection',
          className: 'bg-green-600 text-white hover:bg-green-700',
          disabled: false,
          icon: <CalendarDaysIcon className="h-4 w-4 mr-1" />
        };
      }
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {getBinTypeIcon(bin.binType)}
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">{bin.binId}</h3>
              <p className="text-sm text-gray-500 capitalize">{bin.binType} waste</p>
            </div>
          </div>
          <StatusBadge 
            status={bin.status} 
            fillLevel={bin.sensorData?.fillLevel} 
            type="bin" 
          />
        </div>

        {/* Fill Level Progress */}
        <div className="mb-4">
          <ProgressBar 
            value={bin.sensorData?.fillLevel || 0}
            label="Fill Level"
            size="md"
          />
        </div>

        {/* Capacity */}
        <div className="mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Capacity:</span>
            <span className="font-medium">
              {bin.capacity?.current || 0} / {bin.capacity?.total} {bin.capacity?.unit}
            </span>
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
            <span className="text-sm text-gray-600">{bin.location?.address}</span>
          </div>
        </div>

        {/* Collection Info */}
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
          {(() => {
            const buttonConfig = getScheduleButtonConfig();
            return (
              <button
                onClick={() => {
                  if (!buttonConfig.disabled) {
                    if (userType === 'resident' || userType === 'business') {
                      onRequestCollection(bin);
                    } else {
                      onScheduleCollection ? onScheduleCollection(bin) : onRequestCollection(bin);
                    }
                  }
                }}
                disabled={buttonConfig.disabled}
                className={`flex-1 px-3 py-2 rounded-md text-sm flex items-center justify-center ${buttonConfig.className}`}
              >
                {buttonConfig.icon}
                {buttonConfig.text}
              </button>
            );
          })()}
          <button 
            onClick={() => onViewDetails(bin)}
            className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-50 flex items-center justify-center"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default WasteBinCard;