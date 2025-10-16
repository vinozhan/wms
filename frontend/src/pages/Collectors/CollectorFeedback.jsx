import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { feedbackAPI, collectionAPI } from '../../utils/api';
import { 
  QrCodeIcon,
  SpeakerWaveIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';
import { Volume2, Eye, Smartphone, Settings, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const CollectorFeedback = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [collections, setCollections] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [deviceSettings, setDeviceSettings] = useState({
    audioVolume: 80,
    displayBrightness: 90,
    vibrationIntensity: 70,
    language: 'en',
    timeoutDuration: 30000
  });
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [scanMode, setScanMode] = useState('manual'); // manual, camera, nfc

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'si', name: 'Sinhala' },
    { code: 'ta', name: 'Tamil' }
  ];

  useEffect(() => {
    fetchCollections();
    loadDeviceSettings();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      
      const response = await collectionAPI.getCollections({
        collector: user._id,
        status: ['scheduled', 'in_progress'],
        limit: 50
      });
      
      setCollections(response.data.collections || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceSettings = () => {
    const saved = localStorage.getItem('collectorDeviceSettings');
    if (saved) {
      setDeviceSettings({ ...deviceSettings, ...JSON.parse(saved) });
    }
  };

  const saveDeviceSettings = async (newSettings) => {
    try {
      setDeviceSettings(newSettings);
      localStorage.setItem('collectorDeviceSettings', JSON.stringify(newSettings));
      
      // Also sync with backend if device ID is available
      if (user.deviceId) {
        await feedbackAPI.updateDeviceSettings(user.deviceId, newSettings);
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const simulateScan = async (collectionId, scanType = 'success') => {
    try {
      setScanning(true);
      setSelectedCollection(collectionId);

      // Simulate scan delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const scanResult = {
        success: scanType === 'success',
        method: 'rfid_scan',
        confidence: scanType === 'success' ? 95 : 0,
        deviceId: 'DEVICE-001',
        timestamp: new Date().toISOString()
      };

      const response = await feedbackAPI.generateCollectionFeedback(
        collectionId,
        scanResult,
        {
          language: deviceSettings.language,
          audioVolume: deviceSettings.audioVolume,
          displayBrightness: deviceSettings.displayBrightness,
          vibrationIntensity: deviceSettings.vibrationIntensity
        }
      );

      setFeedback(response.data);
      
      // Play audio feedback if enabled
      if (response.data.audioFeedback.playSound) {
        playAudioFeedback(response.data.audioFeedback);
      }
      
      // Show visual feedback if enabled
      if (response.data.visualFeedback.showDisplay) {
        showVisualFeedback(response.data.visualFeedback);
      }

    } catch (error) {
      console.error('Scan failed:', error);
      toast.error('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const playAudioFeedback = (audioFeedback) => {
    // In a real app, this would play actual audio
    // For demo, we'll use browser's speech synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(audioFeedback.message);
      utterance.volume = audioFeedback.volume / 100;
      utterance.lang = audioFeedback.language === 'si' ? 'si-LK' : 
                     audioFeedback.language === 'ta' ? 'ta-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
    
    // Show audio feedback notification
    toast(audioFeedback.message, {
      icon: audioFeedback.tone === 'success' ? '🔊' : 
            audioFeedback.tone === 'warning' ? '⚠️' : 
            audioFeedback.tone === 'error' ? '❌' : '🔊',
      duration: audioFeedback.duration
    });
  };

  const showVisualFeedback = (visualFeedback) => {
    // Create a visual feedback overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'bg-white rounded-lg p-8 text-center max-w-sm mx-4';
    feedbackElement.innerHTML = `
      <div class="text-6xl mb-4" style="color: ${visualFeedback.displayColor}">
        ${visualFeedback.iconType === 'checkmark' ? '✓' :
          visualFeedback.iconType === 'error' ? '✗' :
          visualFeedback.iconType === 'warning' ? '⚠' :
          visualFeedback.iconType === 'full' ? '📦' : 'ℹ'}
      </div>
      <div class="text-lg font-bold mb-2">${visualFeedback.displayText[0]}</div>
      <div class="text-sm text-gray-600 space-y-1">
        ${visualFeedback.displayText.slice(1).map(line => `<div>${line}</div>`).join('')}
      </div>
    `;
    
    overlay.appendChild(feedbackElement);
    document.body.appendChild(overlay);
    
    // Apply visual effects based on pattern
    if (visualFeedback.displayPattern === 'blinking') {
      feedbackElement.style.animation = 'blink 0.5s infinite';
    } else if (visualFeedback.displayPattern === 'pulsing') {
      feedbackElement.style.animation = 'pulse 1s infinite';
    }
    
    // Remove after duration
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, visualFeedback.displayDuration);
  };

  const completeCollection = async (collectionId) => {
    try {
      const collection = collections.find(c => c._id === collectionId);
      
      await collectionAPI.completeCollection(collectionId, {
        weight: Math.floor(Math.random() * 20) + 5, // Simulate weight
        volume: Math.floor(Math.random() * 50) + 10, // Simulate volume
        verificationMethod: 'rfid_scan',
        collectorNotes: 'Collection completed via mobile app'
      });
      
      toast.success('Collection completed successfully!');
      await fetchCollections();
      setFeedback(null);
      setSelectedCollection(null);
      
    } catch (error) {
      console.error('Failed to complete collection:', error);
      toast.error('Failed to complete collection');
    }
  };

  const getFeedbackTypeIcon = (feedbackType) => {
    switch (feedbackType) {
      case 'success':
      case 'normal_collection':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-600" />;
      case 'warning':
      case 'maintenance_required':
      case 'contamination_warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />;
      default:
        return <CheckCircleIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const getFeedbackTypeColor = (feedbackType) => {
    switch (feedbackType) {
      case 'success':
      case 'normal_collection':
        return 'border-green-400 bg-green-50';
      case 'error':
        return 'border-red-400 bg-red-50';
      case 'warning':
      case 'maintenance_required':
      case 'contamination_warning':
        return 'border-yellow-400 bg-yellow-50';
      default:
        return 'border-gray-400 bg-gray-50';
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Collector Feedback System</h1>
          <p className="text-gray-600">Scan waste bins and receive audio/visual feedback</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2"
          >
            <CogIcon className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Device Settings Panel */}
      {showSettings && (
        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-400">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio Volume: {deviceSettings.audioVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={deviceSettings.audioVolume}
                onChange={(e) => setDeviceSettings({
                  ...deviceSettings,
                  audioVolume: parseInt(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Brightness: {deviceSettings.displayBrightness}%
              </label>
              <input
                type="range"
                min="20"
                max="100"
                value={deviceSettings.displayBrightness}
                onChange={(e) => setDeviceSettings({
                  ...deviceSettings,
                  displayBrightness: parseInt(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vibration Intensity: {deviceSettings.vibrationIntensity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={deviceSettings.vibrationIntensity}
                onChange={(e) => setDeviceSettings({
                  ...deviceSettings,
                  vibrationIntensity: parseInt(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={deviceSettings.language}
                onChange={(e) => setDeviceSettings({
                  ...deviceSettings,
                  language: e.target.value
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout Duration: {deviceSettings.timeoutDuration / 1000}s
              </label>
              <select
                value={deviceSettings.timeoutDuration}
                onChange={(e) => setDeviceSettings({
                  ...deviceSettings,
                  timeoutDuration: parseInt(e.target.value)
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value={15000}>15 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
                <option value={120000}>2 minutes</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => saveDeviceSettings(deviceSettings)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Mode Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Scan Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setScanMode('manual')}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              scanMode === 'manual' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <QrCodeIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <div className="font-medium">Manual Entry</div>
            <div className="text-sm text-gray-500">Enter bin ID manually</div>
          </button>

          <button
            onClick={() => setScanMode('camera')}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              scanMode === 'camera' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Eye className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <div className="font-medium">Camera Scan</div>
            <div className="text-sm text-gray-500">Scan QR codes with camera</div>
          </button>

          <button
            onClick={() => setScanMode('nfc')}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              scanMode === 'nfc' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <div className="font-medium">NFC/RFID</div>
            <div className="text-sm text-gray-500">Tap NFC enabled devices</div>
          </button>
        </div>
      </div>

      {/* Active Feedback Display */}
      {feedback && (
        <div className={`border-l-4 rounded-lg p-6 ${getFeedbackTypeColor(feedback.feedbackType)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {getFeedbackTypeIcon(feedback.feedbackType)}
              <h3 className="text-lg font-medium text-gray-900 ml-3">
                Collection Feedback
              </h3>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Audio Feedback */}
            <div className="space-y-3">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <Volume2 className="h-4 w-4 mr-2" />
                Audio Feedback
              </div>
              <div className="bg-white bg-opacity-60 p-3 rounded">
                <div className="text-sm text-gray-800">{feedback.audioFeedback.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Language: {feedback.audioFeedback.language.toUpperCase()} | 
                  Volume: {feedback.audioFeedback.volume}% | 
                  Tone: {feedback.audioFeedback.tone}
                </div>
              </div>
            </div>

            {/* Visual Feedback */}
            <div className="space-y-3">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <EyeIcon className="h-4 w-4 mr-2" />
                Visual Feedback
              </div>
              <div className="bg-white bg-opacity-60 p-3 rounded">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {feedback.visualFeedback.displayText.map((line, index) => (
                    <div key={index} className="font-mono bg-gray-800 text-green-400 p-1 rounded text-center">
                      {line}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Pattern: {feedback.visualFeedback.displayPattern} | 
                  Color: <span style={{ color: feedback.visualFeedback.displayColor }}>●</span> | 
                  Duration: {feedback.visualFeedback.displayDuration / 1000}s
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {feedback.instructions && feedback.instructions.steps.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                {feedback.instructions.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Warnings */}
          {feedback.warnings && feedback.warnings.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Warnings</h4>
              <div className="space-y-2">
                {feedback.warnings.map((warning, index) => (
                  <div key={index} className="flex items-center p-2 bg-red-100 rounded">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600 mr-2" />
                    <div className="text-sm">
                      <span className="font-medium text-red-800">{warning.type}:</span>
                      <span className="text-red-700 ml-1">{warning.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          {feedback.nextAction && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  if (feedback.nextAction.action === 'complete_collection') {
                    completeCollection(selectedCollection);
                  } else if (feedback.nextAction.action === 'retry_scan') {
                    simulateScan(selectedCollection, 'success');
                  }
                }}
                className={`px-6 py-2 rounded-md font-medium ${
                  feedback.nextAction.action === 'complete_collection'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : feedback.nextAction.action === 'retry_scan'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {feedback.nextAction.description}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collections List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Scheduled Collections</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {collections.map((collection) => (
            <CollectionCard
              key={collection._id}
              collection={collection}
              onScan={simulateScan}
              scanning={scanning && selectedCollection === collection._id}
              language={deviceSettings.language}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Collection Card Component
const CollectionCard = ({ collection, onScan, scanning, language }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'missed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocalizedText = (key, wasteType) => {
    const texts = {
      en: {
        scan_success: 'Scan Successful',
        scan_error: 'Scan Failed',
        scan_maintenance: 'Maintenance Required',
        general: 'General Waste',
        recyclable: 'Recyclable',
        organic: 'Organic Waste',
        hazardous: 'Hazardous Waste',
        electronic: 'Electronic Waste'
      },
      si: {
        scan_success: 'ස්කෑන් සාර්ථකයි',
        scan_error: 'ස්කෑන් අසාර්ථකයි',
        scan_maintenance: 'නඩත්තු අවශ්‍යයි',
        general: 'සාමාන්‍ය අපද්‍රව්‍ය',
        recyclable: 'නැවත භාවිතා කළ හැකි',
        organic: 'කාබනික අපද්‍රව්‍ය',
        hazardous: 'අනතුරුදායක අපද්‍රව්‍ය',
        electronic: 'ඉලෙක්ට්‍රොනික අපද්‍රව්‍ය'
      },
      ta: {
        scan_success: 'ஸ்கேன் வெற்றிகரமானது',
        scan_error: 'ஸ்கேன் தோல்வியடைந்தது',
        scan_maintenance: 'பராமரிப்பு தேவை',
        general: 'பொதுவான கழிவு',
        recyclable: 'மறுசுழற்சி',
        organic: 'கரிம கழிவு',
        hazardous: 'அபாயகரமான கழிவு',
        electronic: 'மின்னணு கழிவு'
      }
    };

    return texts[language]?.[key] || texts['en'][key] || key;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                Bin: {collection.wasteBin?.binId}
              </h4>
              <p className="text-sm text-gray-600">
                {collection.wasteBin?.location?.address}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(collection.status)}`}>
              {collection.status}
            </span>
          </div>
          
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-1 font-medium">
                {getLocalizedText(collection.wasteData.wasteType)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Fill Level:</span>
              <span className="ml-1 font-medium">
                {collection.wasteBin?.sensorData?.fillLevel || 0}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Scheduled:</span>
              <span className="ml-1 font-medium">
                {new Date(collection.scheduledDate).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Priority:</span>
              <span className={`ml-1 font-medium ${
                collection.priority === 'urgent' ? 'text-red-600' :
                collection.priority === 'high' ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {collection.priority || 'normal'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onScan(collection._id, 'success')}
            disabled={scanning}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {scanning ? (
              <>
                <Zap className="h-4 w-4 animate-pulse" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                <span>Scan OK</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => onScan(collection._id, 'maintenance')}
            disabled={scanning}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>Issue</span>
          </button>
          
          <button
            onClick={() => onScan(collection._id, 'error')}
            disabled={scanning}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <XCircleIcon className="h-4 w-4" />
            <span>Error</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectorFeedback;