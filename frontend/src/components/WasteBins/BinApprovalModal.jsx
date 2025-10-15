import React, { useState, useEffect } from 'react';
import { Modal } from '../common';
import { MapPinIcon, CogIcon, TagIcon } from '@heroicons/react/24/outline';
import { settingsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const BinApprovalModal = ({ isOpen, onClose, onApprove, request }) => {
  const [formData, setFormData] = useState({
    // Auto-populate from request
    binType: request?.binType || 'general',
    deviceType: request?.deviceType || 'smart_sensor',
    capacity: {
      total: request?.capacity?.total || 60,
      unit: request?.capacity?.unit || 'liters'
    },
    
    // Admin fills these required fields
    binId: '',
    deviceId: '',
    location: {
      address: request?.location?.address || request?.preferredLocation || '',
      coordinates: [0, 0]
    },
    
    // Optional admin notes
    adminNotes: ''
  });

  const [coordinates, setCoordinates] = useState({
    latitude: '',
    longitude: ''
  });
  
  const [loadingIds, setLoadingIds] = useState(false);

  // Auto-generate IDs when modal opens
  useEffect(() => {
    if (isOpen && request) {
      loadAndGenerateIds();
    }
  }, [isOpen, request]);

  // Update form data when request changes
  useEffect(() => {
    if (request) {
      setFormData(prev => ({
        ...prev,
        binType: request?.binType || 'general',
        deviceType: request?.deviceType || 'smart_sensor',
        capacity: {
          total: request?.capacity?.total || 60,
          unit: request?.capacity?.unit || 'liters'
        },
        location: {
          ...prev.location,
          address: request?.location?.address || request?.preferredLocation || ''
        }
      }));
    }
  }, [request]);

  const loadAndGenerateIds = async () => {
    try {
      setLoadingIds(true);
      
      // Preview next IDs without incrementing counters
      const previewResponse = await settingsAPI.previewNextIds();
      
      const nextBinId = previewResponse.data.nextIds.binId;
      const nextDeviceId = previewResponse.data.nextIds.deviceId;
      
      setFormData(prev => ({
        ...prev,
        binId: nextBinId,
        deviceId: nextDeviceId
      }));
      
    } catch (error) {
      console.error('Failed to preview next IDs:', error);
      toast.error('Failed to preview next IDs');
    } finally {
      setLoadingIds(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.binId || !formData.deviceId || !formData.location.address) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoadingIds(true);
      
      // Generate actual IDs only when approving (increment counters)
      const binResponse = await settingsAPI.generateBinId();
      const deviceResponse = await settingsAPI.generateDeviceId();
      
      const actualBinId = binResponse.data.binId;
      const actualDeviceId = deviceResponse.data.deviceId;

      if (coordinates.latitude && coordinates.longitude) {
        formData.location.coordinates = [
          parseFloat(coordinates.longitude),
          parseFloat(coordinates.latitude)
        ];
      }

      const binData = {
        // Required fields for WasteBin creation - use actual generated IDs
        binId: actualBinId,
        deviceId: actualDeviceId,
        deviceType: formData.deviceType,
        binType: formData.binType,
        owner: request?.requester?._id || request?.requester,
        capacity: formData.capacity,
        location: formData.location,
        
        // Additional metadata
        adminNotes: formData.adminNotes
      };

      onApprove(request._id, binData);
      onClose();
      
    } catch (error) {
      console.error('Failed to generate final IDs:', error);
      toast.error('Failed to generate final IDs for approval');
    } finally {
      setLoadingIds(false);
    }
  };

  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approve Bin Request" size="lg">
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Request Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Requester:</strong> {request.requester?.name}</div>
          <div><strong>Type:</strong> {request.binType}</div>
          <div><strong>Capacity:</strong> {request.capacity?.total || 60} {request.capacity?.unit || 'liters'}</div>
          <div><strong>Phone:</strong> {request.contactPhone}</div>
        </div>
        {request.justification && (
          <div className="mt-2">
            <strong>Justification:</strong> {request.justification}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bin Identification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TagIcon className="h-4 w-4 inline mr-1" />
              Bin ID *
            </label>
            <input
              type="text"
              value={loadingIds ? 'Loading preview...' : formData.binId}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-blue-50 text-blue-700"
              placeholder="BIN-2025-001"
              required
              readOnly
            />
            <p className="mt-1 text-xs text-blue-600">Preview - Final ID generated on approval</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              <CogIcon className="h-4 w-4 inline mr-1" />
              Device ID *
            </label>
            <input
              type="text"
              value={loadingIds ? 'Loading preview...' : formData.deviceId}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-blue-50 text-blue-700"
              placeholder="DEV-SNS-001"
              required
              readOnly
            />
            <p className="mt-1 text-xs text-blue-600">Preview - Final ID generated on approval</p>
          </div>
        </div>

        {/* Bin Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bin Type</label>
            <select
              value={formData.binType}
              onChange={(e) => setFormData(prev => ({ ...prev, binType: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="general">General Waste</option>
              <option value="recyclable">Recyclable</option>
              <option value="organic">Organic</option>
              <option value="hazardous">Hazardous</option>
              <option value="electronic">Electronic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Device Type</label>
            <select
              value={formData.deviceType}
              onChange={(e) => setFormData(prev => ({ ...prev, deviceType: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="smart_sensor">Smart Sensor</option>
              <option value="rfid_tag">RFID Tag</option>
              <option value="barcode">Barcode</option>
              <option value="qr_code">QR Code</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity</label>
            <div className="flex">
              <input
                type="number"
                value={formData.capacity.total}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  capacity: { ...prev.capacity, total: parseInt(e.target.value) }
                }))}
                className="mt-1 block w-2/3 border border-gray-300 rounded-l-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                min="1"
              />
              <select
                value={formData.capacity.unit}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  capacity: { ...prev.capacity, unit: e.target.value }
                }))}
                className="mt-1 block w-1/3 border border-gray-300 rounded-r-md px-2 py-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="liters">L</option>
                <option value="kg">kg</option>
                <option value="cubic_meters">m³</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <MapPinIcon className="h-4 w-4 inline mr-1" />
            Installation Address *
          </label>
          <textarea
            value={formData.location.address}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              location: { ...prev.location, address: e.target.value }
            }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
            rows="2"
            required
          />
        </div>

        {/* GPS Coordinates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude (Optional)</label>
            <input
              type="number"
              step="any"
              value={coordinates.latitude}
              onChange={(e) => setCoordinates(prev => ({ ...prev, latitude: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
              placeholder="6.9271"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude (Optional)</label>
            <input
              type="number"
              step="any"
              value={coordinates.longitude}
              onChange={(e) => setCoordinates(prev => ({ ...prev, longitude: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
              placeholder="79.8612"
            />
          </div>
        </div>

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Admin Notes (Optional)</label>
          <textarea
            value={formData.adminNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
            rows="2"
            placeholder="Any additional notes about the installation..."
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
            disabled={loadingIds}
            className={`px-4 py-2 text-sm text-white rounded-md ${
              loadingIds 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
{loadingIds ? 'Generating Final IDs...' : 'Approve'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BinApprovalModal;