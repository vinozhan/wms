import React, { useState, useEffect } from 'react';
import { QrCodeIcon, ScaleIcon, CubeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CollectionScanForm = ({ collection, onComplete, onCancel }) => {
  const [formData, setFormData] = useState({
    weight: '',
    volume: '',
    wasteType: collection?.wasteBin?.binType || 'general',
    contaminated: false,
    notes: '',
    verification: {
      method: 'manual_entry',
      deviceId: collection?.wasteBin?.deviceId || '',
      timestamp: new Date().toISOString()
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const wasteTypes = [
    { value: 'general', label: 'General Waste', color: 'bg-gray-500' },
    { value: 'recyclable', label: 'Recyclable', color: 'bg-green-500' },
    { value: 'organic', label: 'Organic/Compostable', color: 'bg-yellow-500' },
    { value: 'hazardous', label: 'Hazardous', color: 'bg-red-500' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleScanQR = () => {
    // Simulate QR code scanning
    if (collection?.wasteBin?.deviceId) {
      setFormData(prev => ({
        ...prev,
        verification: {
          ...prev.verification,
          method: 'qr_scan',
          deviceId: collection.wasteBin.deviceId,
          timestamp: new Date().toISOString()
        }
      }));
      toast.success('QR Code scanned successfully!');
    } else {
      toast.error('No device ID found for this bin');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.weight || !formData.volume) {
      toast.error('Please enter both weight and volume');
      return;
    }

    if (parseFloat(formData.weight) <= 0 || parseFloat(formData.volume) <= 0) {
      toast.error('Weight and volume must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const completionData = {
        weight: parseFloat(formData.weight),
        volume: parseFloat(formData.volume),
        verification: formData.verification,
        contamination: formData.contaminated ? {
          detected: true,
          description: formData.notes || 'Contamination detected during collection'
        } : null,
        notes: formData.notes
      };

      await onComplete(completionData);
      // Toast message shown by parent component
    } catch (error) {
      console.error('Failed to complete collection:', error);
      toast.error('Failed to complete collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEstimatedCost = () => {
    const weight = parseFloat(formData.weight) || 0;
    const rates = {
      general: 30,
      recyclable: 15,
      organic: 25,
      hazardous: 100
    };
    
    const baseAmount = weight * (rates[formData.wasteType] || rates.general);
    const contamination = formData.contaminated ? 200 : 0;
    const tax = (baseAmount + contamination) * 0.15;
    
    return baseAmount + contamination + tax;
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Collection Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Bin ID:</span> {collection?.wasteBin?.binId}
          </div>
          <div>
            <span className="font-medium">Bin Type:</span> 
            <span className="ml-2 capitalize">{collection?.wasteBin?.binType}</span>
          </div>
          <div>
            <span className="font-medium">Owner:</span> {collection?.wasteBin?.owner?.name}
          </div>
          <div>
            <span className="font-medium">Collection ID:</span> {collection?.collectionId}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Scan Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <QrCodeIcon className="h-5 w-5 mr-2" />
            Device Verification
          </h4>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleScanQR}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <QrCodeIcon className="h-5 w-5" />
              <span>Scan QR Code</span>
            </button>
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm">
              Method: {formData.verification.method === 'qr_scan' ? 'QR Scanned' : 'Manual Entry'}
            </div>
          </div>
        </div>

        {/* Weight and Volume */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ScaleIcon className="h-4 w-4 inline mr-1" />
              Weight (kg) *
            </label>
            <input
              type="number"
              name="weight"
              step="0.1"
              min="0"
              value={formData.weight}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter weight in kg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CubeIcon className="h-4 w-4 inline mr-1" />
              Volume (liters) *
            </label>
            <input
              type="number"
              name="volume"
              step="0.1"
              min="0"
              value={formData.volume}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter volume in liters"
              required
            />
          </div>
        </div>

        {/* Waste Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waste Type *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {wasteTypes.map((type) => (
              <label key={type.value} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="wasteType"
                  value={type.value}
                  checked={formData.wasteType === type.value}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border-2 text-center transition-all ${
                  formData.wasteType === type.value
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}>
                  <div className={`w-4 h-4 ${type.color} rounded-full mx-auto mb-1`}></div>
                  <div className="text-xs font-medium">{type.label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Contamination Check */}
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="contaminated"
              checked={formData.contaminated}
              onChange={handleInputChange}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Contamination Detected</span>
            </div>
          </label>
          {formData.contaminated && (
            <div className="mt-3">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Describe the contamination..."
              />
            </div>
          )}
        </div>

        {/* Estimated Cost */}
        {(formData.weight || formData.volume) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-md font-medium text-green-900 mb-2">Estimated Bill</h4>
            <div className="text-2xl font-bold text-green-700">
              LKR {calculateEstimatedCost().toFixed(2)}
            </div>
            <div className="text-sm text-green-600 mt-1">
              Based on {formData.weight}kg of {formData.wasteType} waste
              {formData.contaminated && ' + contamination penalty'}
            </div>
          </div>
        )}

        {/* Notes */}
        {!formData.contaminated && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional observations or notes..."
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 px-6 py-3 rounded-md text-white font-medium ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Complete Collection & Generate Bill'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CollectionScanForm;