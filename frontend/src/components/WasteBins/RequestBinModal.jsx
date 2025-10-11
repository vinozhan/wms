import React, { useState } from 'react';
import { Modal } from '../common';

const RequestBinModal = ({ isOpen, onClose, onSubmit, currentUser }) => {
  const [formData, setFormData] = useState({
    binType: 'general',
    preferredLocation: '',
    justification: '',
    contactPhone: currentUser?.phone || '',
    additionalNotes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request New Waste Bin" size="md">
      <p className="text-sm text-gray-600 mb-4">
        Submit a request for a new waste bin. Our team will contact you within 2-3 business days to arrange installation.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700">Preferred Location</label>
          <textarea
            value={formData.preferredLocation}
            onChange={(e) => setFormData(prev => ({ ...prev, preferredLocation: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            rows="3"
            placeholder="Describe the preferred location for the bin (e.g., front gate, side of building, etc.)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Justification</label>
          <textarea
            value={formData.justification}
            onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Phone number for installation coordination"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Additional Notes (Optional)</label>
          <textarea
            value={formData.additionalNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
            Submit Request
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestBinModal;