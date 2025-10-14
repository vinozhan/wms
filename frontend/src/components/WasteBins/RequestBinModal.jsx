import React, { useState, useEffect } from 'react';
import { Modal } from '../common';

const RequestBinModal = ({ isOpen, onClose, onSubmit, currentUser, editMode = false, existingRequest = null }) => {
  const [formData, setFormData] = useState({
    // Basic bin information
    binType: 'general',
    deviceType: 'smart_sensor',
    capacity: {
      total: 60,
      unit: 'liters'
    },
    
    // Location information
    location: {
      address: '',
      coordinates: [0, 0] // Will be set by admin during approval
    },
    
    // Request specific fields
    preferredLocation: '',
    justification: '',
    contactPhone: currentUser?.phone || '',
    additionalNotes: ''
  });

  // Populate form data when editing
  useEffect(() => {
    if (editMode && existingRequest) {
      setFormData({
        binType: existingRequest.binType || 'general',
        deviceType: existingRequest.deviceType || 'smart_sensor',
        capacity: {
          total: existingRequest.capacity?.total || 60,
          unit: existingRequest.capacity?.unit || 'liters'
        },
        location: {
          address: existingRequest.location?.address || existingRequest.preferredLocation || '',
          coordinates: existingRequest.location?.coordinates || [0, 0]
        },
        preferredLocation: existingRequest.preferredLocation || '',
        justification: existingRequest.justification || '',
        contactPhone: existingRequest.contactPhone || currentUser?.phone || '',
        additionalNotes: existingRequest.additionalNotes || ''
      });
    } else {
      // Reset to default values when not editing
      setFormData({
        binType: 'general',
        deviceType: 'smart_sensor',
        capacity: {
          total: 60,
          unit: 'liters'
        },
        location: {
          address: '',
          coordinates: [0, 0]
        },
        preferredLocation: '',
        justification: '',
        contactPhone: currentUser?.phone || '',
        additionalNotes: ''
      });
    }
  }, [editMode, existingRequest, currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editMode ? "Edit Bin Request" : "Request New Waste Bin"} size="md">
      <p className="text-sm text-gray-600 mb-4">
        {editMode 
          ? "Update your bin request details. Changes will be reviewed by our team."
          : "Submit a request for a new waste bin. Our team will contact you within 2-3 business days to arrange installation."
        }
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bin Type *</label>
            <select
              value={formData.binType}
              onChange={(e) => setFormData(prev => ({ ...prev, binType: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
              required
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
              <option value="smart_sensor">Smart Sensor (Recommended)</option>
              <option value="rfid_tag">RFID Tag</option>
              <option value="barcode">Barcode</option>
              <option value="qr_code">QR Code</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity (Liters)</label>
            <select
              value={formData.capacity.total}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                capacity: { ...prev.capacity, total: parseInt(e.target.value) }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value={30}>30 Liters (Small)</option>
              <option value={60}>60 Liters (Standard)</option>
              <option value={120}>120 Liters (Large)</option>
              <option value={240}>240 Liters (Extra Large)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <select
              value={formData.capacity.unit}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                capacity: { ...prev.capacity, unit: e.target.value }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="liters">Liters</option>
              <option value="kg">Kilograms</option>
              <option value="cubic_meters">Cubic Meters</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Installation Address *</label>
          <textarea
            value={formData.location.address}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              location: { ...prev.location, address: e.target.value },
              preferredLocation: e.target.value
            }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
            rows="2"
            placeholder="Full address where the bin should be installed"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Specific Location Details</label>
          <textarea
            value={formData.preferredLocation}
            onChange={(e) => setFormData(prev => ({ ...prev, preferredLocation: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
            rows="2"
            placeholder="Specific details (e.g., front gate, side of building, near parking, etc.)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Justification</label>
          <textarea
            value={formData.justification}
            onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
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
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Phone number for installation coordination"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Additional Notes (Optional)</label>
          <textarea
            value={formData.additionalNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
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
            {editMode ? 'Update Request' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestBinModal;