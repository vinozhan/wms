import React, { useState } from 'react';
import { Modal } from '../common';

const CreateBinModal = ({ isOpen, onClose, onSubmit, users, userType, currentUser }) => {
  const [formData, setFormData] = useState({
    binId: '',
    owner: userType === 'collector' ? currentUser._id : '',
    deviceType: 'rfid_tag',
    deviceId: '',
    binType: 'general',
    capacity: {
      total: 120,
      unit: 'liters'
    },
    location: {
      coordinates: ['', ''],
      address: ''
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const binData = {
      ...formData,
      capacity: {
        total: parseFloat(formData.capacity.total),
        unit: formData.capacity.unit,
        current: 0
      },
      location: {
        type: 'Point',
        coordinates: [parseFloat(formData.location.coordinates[1]), parseFloat(formData.location.coordinates[0])], // [lng, lat]
        address: formData.location.address
      }
    };

    onSubmit(binData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Waste Bin" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bin ID</label>
            <input
              type="text"
              value={formData.binId}
              onChange={(e) => setFormData(prev => ({ ...prev, binId: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., BIN-001"
              required
            />
          </div>

          {userType === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner</label>
              <select
                value={formData.owner}
                onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Owner</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email}) - {user.userType}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Device Type</label>
            <select
              value={formData.deviceType}
              onChange={(e) => setFormData(prev => ({ ...prev, deviceType: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="rfid_tag">RFID Tag</option>
              <option value="barcode">Barcode</option>
              <option value="smart_sensor">Smart Sensor</option>
              <option value="qr_code">QR Code</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Device ID</label>
            <input
              type="text"
              value={formData.deviceId}
              onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., RFID-001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bin Type</label>
            <select
              value={formData.binType}
              onChange={(e) => setFormData(prev => ({ ...prev, binType: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="general">General Waste</option>
              <option value="recyclable">Recyclable</option>
              <option value="organic">Organic</option>
              <option value="hazardous">Hazardous</option>
              <option value="electronic">Electronic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity</label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={formData.capacity.total}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  capacity: { ...prev.capacity, total: e.target.value }
                }))}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                placeholder="120"
                required
                min="1"
              />
              <select
                value={formData.capacity.unit}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  capacity: { ...prev.capacity, unit: e.target.value }
                }))}
                className="w-24 border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="liters">Liters</option>
                <option value="kg">Kg</option>
                <option value="cubic_meters">m³</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input
              type="number"
              step="any"
              value={formData.location.coordinates[0]}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                location: { 
                  ...prev.location, 
                  coordinates: [e.target.value, prev.location.coordinates[1]]
                }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="6.9271"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input
              type="number"
              step="any"
              value={formData.location.coordinates[1]}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                location: { 
                  ...prev.location, 
                  coordinates: [prev.location.coordinates[0], e.target.value]
                }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="79.8612"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea
            value={formData.location.address}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              location: { ...prev.location, address: e.target.value }
            }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            rows="2"
            placeholder="Street address, City, District"
            required
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
            Create Bin
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBinModal;