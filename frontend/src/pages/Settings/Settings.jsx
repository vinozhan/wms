import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { settingsAPI } from '../../utils/api';
import { 
  CogIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('rates');

  const [settings, setSettings] = useState({
    paymentRates: {
      general: 30,
      recyclable: 15,
      organic: 25,
      hazardous: 100,
      contamination: 200,
      taxRate: 15
    },
    idCounters: {
      binIdPrefix: 'BIN',
      binIdYear: new Date().getFullYear(),
      binIdCounter: 1000,
      deviceIdPrefix: 'DEV-SNS',
      deviceIdCounter: 1
    }
  });

  useEffect(() => {
    if (user?.userType === 'admin') {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use default settings if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateSettings(settings);
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRateChange = (wasteType, value) => {
    setSettings(prev => ({
      ...prev,
      paymentRates: {
        ...prev.paymentRates,
        [wasteType]: parseFloat(value) || 0
      }
    }));
  };

  const handleIdCounterChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      idCounters: {
        ...prev.idCounters,
        [field]: field.includes('Counter') ? parseInt(value) || 1 : value
      }
    }));
  };

  if (user?.userType !== 'admin') {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to access settings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure payment rates and system defaults</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            saving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('rates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rates'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
            Payment Rates
          </button>
          <button
            onClick={() => setActiveTab('ids')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ids'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-4 w-4 inline mr-1" />
            ID Generation
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Waste Collection Rates (LKR per kg)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">General Waste</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">LKR</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.paymentRates.general}
                      onChange={(e) => handleRateChange('general', e.target.value)}
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-12 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Recyclable</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">LKR</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.paymentRates.recyclable}
                      onChange={(e) => handleRateChange('recyclable', e.target.value)}
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-12 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Organic</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">LKR</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.paymentRates.organic}
                      onChange={(e) => handleRateChange('organic', e.target.value)}
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-12 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Hazardous</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">LKR</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.paymentRates.hazardous}
                      onChange={(e) => handleRateChange('hazardous', e.target.value)}
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-12 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contamination Penalty</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">LKR</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.paymentRates.contamination}
                      onChange={(e) => handleRateChange('contamination', e.target.value)}
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-12 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      step="0.01"
                      value={settings.paymentRates.taxRate}
                      onChange={(e) => handleRateChange('taxRate', e.target.value)}
                      className="focus:ring-green-500 focus:border-green-500 block w-full pr-8 py-2 sm:text-sm border-gray-300 rounded-md"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ids' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Auto-Generated ID Configuration
              </h3>
              
              <div className="space-y-6">
                {/* Bin ID Configuration */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Bin ID Format</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Prefix</label>
                      <input
                        type="text"
                        value={settings.idCounters.binIdPrefix}
                        onChange={(e) => handleIdCounterChange('binIdPrefix', e.target.value)}
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="BIN"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Year</label>
                      <input
                        type="number"
                        value={settings.idCounters.binIdYear}
                        onChange={(e) => handleIdCounterChange('binIdYear', e.target.value)}
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        min="2020"
                        max="2099"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Next Counter</label>
                      <input
                        type="number"
                        value={settings.idCounters.binIdCounter}
                        onChange={(e) => handleIdCounterChange('binIdCounter', e.target.value)}
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        min="1"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Next Bin ID: <code className="bg-gray-100 px-2 py-1 rounded">
                      {settings.idCounters.binIdPrefix}-{settings.idCounters.binIdYear}-{String(settings.idCounters.binIdCounter).padStart(3, '0')}
                    </code>
                  </p>
                </div>

                {/* Device ID Configuration */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Device ID Format</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Prefix</label>
                      <input
                        type="text"
                        value={settings.idCounters.deviceIdPrefix}
                        onChange={(e) => handleIdCounterChange('deviceIdPrefix', e.target.value)}
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="DEV-SNS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Next Counter</label>
                      <input
                        type="number"
                        value={settings.idCounters.deviceIdCounter}
                        onChange={(e) => handleIdCounterChange('deviceIdCounter', e.target.value)}
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        min="1"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Next Device ID: <code className="bg-gray-100 px-2 py-1 rounded">
                      {settings.idCounters.deviceIdPrefix}-{String(settings.idCounters.deviceIdCounter).padStart(3, '0')}
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;