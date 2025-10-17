const Collection = require('../models/Collection');
const WasteBin = require('../models/WasteBin');
const User = require('../models/User');

class FeedbackService {
  
  static async generateCollectionFeedback(collectionId, scanResult, options = {}) {
    try {
      const collection = await Collection.findById(collectionId)
        .populate('wasteBin')
        .populate('collector');

      if (!collection) {
        throw new Error('Collection not found');
      }

      const wasteBin = collection.wasteBin;
      
      // Generate feedback based on scan result and collection status
      const feedback = {
        collectionId: collection.collectionId,
        binId: wasteBin.binId,
        timestamp: new Date(),
        scanResult: scanResult,
        feedbackType: this.determineFeedbackType(scanResult, collection, wasteBin),
        audioFeedback: this.generateAudioFeedback(scanResult, collection, wasteBin, options.language),
        visualFeedback: this.generateVisualFeedback(scanResult, collection, wasteBin),
        instructions: this.generateInstructions(scanResult, collection, wasteBin, options.language),
        warnings: this.generateWarnings(collection, wasteBin),
        confirmation: this.generateConfirmation(scanResult, collection),
        nextAction: this.determineNextAction(scanResult, collection, wasteBin),
        deviceSettings: this.getDeviceSettings(collection, options)
      };

      // Update collection with feedback
      await Collection.findByIdAndUpdate(collectionId, {
        'feedback.audioConfirmation': feedback.audioFeedback.playSound,
        'feedback.visualConfirmation': feedback.visualFeedback.showDisplay,
        'feedback.message': feedback.confirmation.message
      });

      return feedback;

    } catch (error) {
      console.error('Error generating collection feedback:', error);
      throw error;
    }
  }

  static determineFeedbackType(scanResult, collection, wasteBin) {
    if (!scanResult.success) {
      return 'error';
    }
    
    if (collection.status === 'completed') {
      return 'already_collected';
    }
    
    if (wasteBin.status === 'maintenance') {
      return 'maintenance_required';
    }
    
    if (wasteBin.fillPercentage < 10) {
      return 'nearly_empty';
    }
    
    if (wasteBin.fillPercentage >= 80) {
      return 'full_bin';
    }
    
    return 'normal_collection';
  }

  static generateAudioFeedback(scanResult, collection, wasteBin, language = 'en') {
    const audioMessages = {
      en: {
        success: "Scan successful. Bin ready for collection.",
        already_collected: "This bin has already been collected today.",
        maintenance_required: "Warning: This bin requires maintenance.",
        nearly_empty: "Notice: Bin is nearly empty but collection proceeding.",
        full_bin: "Bin is full. Collection recommended immediately.",
        error: "Scan failed. Please try again.",
        contamination_warning: "Warning: Contamination detected in this bin.",
        special_handling: "Special handling required for this waste type.",
        collection_confirmed: "Collection confirmed successfully.",
        weight_recorded: "Weight recorded successfully.",
        route_updated: "Route information updated."
      },
      si: { // Sinhala
        success: "ස්කෑන් කිරීම සාර්ථකයි. බින් එක සිදු කිරීමට සූදානම්.",
        already_collected: "මෙම බින් එක අද දිනයේ දීම සිදු කර ඇත.",
        maintenance_required: "අවවාදයයි: මෙම බින් එකට නඩත්තු අවශ්‍යයි.",
        error: "ස්කෑන් අසාර්ථකයි. කරුණාකර නැවත උත්සාහ කරන්න.",
        collection_confirmed: "සිදු කිරීම සාර්ථකව තහවුරු විය."
      },
      ta: { // Tamil
        success: "ஸ்கேன் வெற்றிகரமானது. தொட்டி சேகரிப்புக்கு தயாராக உள்ளது.",
        already_collected: "இந்த தொட்டி இன்று ஏற்கனவே சேகரிக்கப்பட்டது.",
        error: "ஸ்கேன் தோல்வியடைந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
        collection_confirmed: "சேகரிப்பு வெற்றிகரமாக உறுதிப்படுத்தப்பட்டது."
      }
    };

    const messages = audioMessages[language] || audioMessages.en;
    const feedbackType = this.determineFeedbackType(scanResult, collection, wasteBin);
    
    let message = messages[feedbackType] || messages.success;
    let tone = 'neutral';
    let volume = 80;
    let duration = 3000; // milliseconds

    // Adjust tone and volume based on feedback type
    switch (feedbackType) {
      case 'error':
        tone = 'error';
        volume = 90;
        duration = 2000;
        break;
      case 'maintenance_required':
      case 'contamination_warning':
        tone = 'warning';
        volume = 85;
        duration = 4000;
        break;
      case 'full_bin':
        tone = 'urgent';
        volume = 85;
        duration = 3500;
        break;
      case 'success':
      case 'collection_confirmed':
        tone = 'success';
        volume = 75;
        duration = 2500;
        break;
    }

    // Add weight information if available
    if (collection.wasteData.weight && feedbackType === 'normal_collection') {
      const weightMessage = language === 'si' ? 
        `බර කිලෝග්‍රෑම් ${collection.wasteData.weight}` :
        language === 'ta' ?
        `எடை ${collection.wasteData.weight} கிலோகிராம்` :
        `Weight: ${collection.wasteData.weight} kilograms`;
      message += ` ${weightMessage}.`;
    }

    return {
      playSound: true,
      message: message,
      tone: tone,
      volume: volume,
      duration: duration,
      language: language,
      audioFile: this.getAudioFileName(feedbackType, language),
      repeat: feedbackType === 'error' ? 2 : 1
    };
  }

  static generateVisualFeedback(scanResult, collection, wasteBin) {
    const feedbackType = this.determineFeedbackType(scanResult, collection, wasteBin);
    
    let displayColor = '#00FF00'; // Green
    let displayPattern = 'solid';
    let displayIntensity = 80;
    let displayDuration = 3000;
    let iconType = 'checkmark';

    switch (feedbackType) {
      case 'error':
        displayColor = '#FF0000'; // Red
        displayPattern = 'blinking';
        displayIntensity = 100;
        displayDuration = 2000;
        iconType = 'error';
        break;
      case 'maintenance_required':
        displayColor = '#FFA500'; // Orange
        displayPattern = 'pulsing';
        displayIntensity = 90;
        displayDuration = 4000;
        iconType = 'warning';
        break;
      case 'full_bin':
        displayColor = '#FFD700'; // Gold
        displayPattern = 'fast_blink';
        displayIntensity = 95;
        displayDuration = 3500;
        iconType = 'full';
        break;
      case 'already_collected':
        displayColor = '#808080'; // Gray
        displayPattern = 'dim';
        displayIntensity = 50;
        displayDuration = 2000;
        iconType = 'completed';
        break;
      case 'nearly_empty':
        displayColor = '#87CEEB'; // Sky Blue
        displayPattern = 'slow_pulse';
        displayIntensity = 70;
        displayDuration = 2500;
        iconType = 'info';
        break;
    }

    const displayText = this.generateDisplayText(scanResult, collection, wasteBin);

    return {
      showDisplay: true,
      displayColor: displayColor,
      displayPattern: displayPattern,
      displayIntensity: displayIntensity,
      displayDuration: displayDuration,
      iconType: iconType,
      displayText: displayText,
      qrCodeDisplay: this.shouldShowQrCode(feedbackType),
      ledSequence: this.generateLedSequence(feedbackType),
      screenLayout: this.generateScreenLayout(collection, wasteBin, feedbackType)
    };
  }

  static generateDisplayText(scanResult, collection, wasteBin) {
    const lines = [];
    
    // Line 1: Status
    if (scanResult.success) {
      lines.push("✓ SCAN SUCCESS");
    } else {
      lines.push("✗ SCAN FAILED");
    }

    // Line 2: Bin ID
    lines.push(`BIN: ${wasteBin.binId}`);

    // Line 3: Collection Info
    if (collection.status === 'completed') {
      lines.push("ALREADY COLLECTED");
    } else {
      lines.push(`FILL: ${wasteBin.fillPercentage}%`);
    }

    // Line 4: Weight (if available)
    if (collection.wasteData.weight) {
      lines.push(`WEIGHT: ${collection.wasteData.weight}kg`);
    }

    // Line 5: Time
    lines.push(new Date().toLocaleTimeString());

    return lines;
  }

  static generateInstructions(scanResult, collection, wasteBin, language = 'en') {
    const instructions = {
      en: {
        normal: [
          "1. Confirm bin contents match expected waste type",
          "2. Record actual weight if different from sensor reading",
          "3. Check for contamination",
          "4. Complete collection when finished",
          "5. Move to next scheduled location"
        ],
        maintenance: [
          "1. Do not collect - maintenance required",
          "2. Report maintenance issue in app",
          "3. Take photo of problem if safe to do so",
          "4. Contact supervisor if urgent",
          "5. Skip to next collection point"
        ],
        contamination: [
          "1. Assess contamination level",
          "2. Take photos for documentation",
          "3. Decide: collect with penalty or skip",
          "4. Report contamination in app",
          "5. Notify property owner if severe"
        ],
        full: [
          "1. Priority collection - bin is full",
          "2. Use appropriate vehicle capacity",
          "3. Check for overflow around bin",
          "4. Clean area if needed",
          "5. Update collection status immediately"
        ]
      }
    };

    const feedbackType = this.determineFeedbackType(scanResult, collection, wasteBin);
    let instructionType = 'normal';

    if (feedbackType === 'maintenance_required') instructionType = 'maintenance';
    else if (wasteBin.status === 'full') instructionType = 'full';
    else if (collection.wasteData.contamination?.detected) instructionType = 'contamination';

    return {
      type: instructionType,
      steps: instructions[language]?.[instructionType] || instructions.en[instructionType],
      priority: instructionType === 'maintenance' ? 'high' : 'normal',
      estimatedTime: this.getEstimatedTime(instructionType, wasteBin),
      tools: this.getRequiredTools(instructionType),
      safety: this.getSafetyInstructions(instructionType, wasteBin)
    };
  }

  static generateWarnings(collection, wasteBin) {
    const warnings = [];

    // Maintenance warnings
    if (wasteBin.status === 'maintenance') {
      warnings.push({
        type: 'maintenance',
        severity: 'high',
        message: 'Bin requires maintenance - do not collect',
        action: 'Report and skip collection'
      });
    }

    // Contamination warnings
    if (collection.wasteData.contamination?.detected) {
      warnings.push({
        type: 'contamination',
        severity: collection.wasteData.contamination.level,
        message: `${collection.wasteData.contamination.level} level contamination detected`,
        action: 'Assess and document before collection'
      });
    }

    // Overweight warnings
    if (collection.wasteData.weight > 50) {
      warnings.push({
        type: 'overweight',
        severity: 'medium',
        message: 'Heavy load detected - use proper lifting techniques',
        action: 'Consider team lift or mechanical assistance'
      });
    }

    // Schedule warnings
    const now = new Date();
    const scheduledTime = new Date(collection.scheduledDate);
    if (now.getTime() - scheduledTime.getTime() > 2 * 60 * 60 * 1000) { // 2+ hours late
      warnings.push({
        type: 'schedule_delay',
        severity: 'low',
        message: 'Collection is behind schedule',
        action: 'Update estimated completion time'
      });
    }

    return warnings;
  }

  static generateConfirmation(scanResult, collection) {
    if (!scanResult.success) {
      return {
        success: false,
        message: 'Scan failed - collection not confirmed',
        code: 'SCAN_FAILED',
        timestamp: new Date(),
        retryAvailable: true
      };
    }

    return {
      success: true,
      message: 'Collection scan confirmed successfully',
      code: 'COLLECTION_CONFIRMED',
      timestamp: new Date(),
      collectionId: collection.collectionId,
      binId: collection.wasteBin.binId,
      verificationMethod: scanResult.method,
      confidence: scanResult.confidence || 95
    };
  }

  static determineNextAction(scanResult, collection, wasteBin) {
    if (!scanResult.success) {
      return {
        action: 'retry_scan',
        description: 'Retry scanning the waste bin',
        timeout: 30000, // 30 seconds
        alternatives: ['manual_entry', 'skip_collection']
      };
    }

    if (wasteBin.status === 'maintenance') {
      return {
        action: 'skip_collection',
        description: 'Skip this collection due to maintenance requirements',
        nextStep: 'report_maintenance',
        alternatives: []
      };
    }

    if (collection.status === 'completed') {
      return {
        action: 'proceed_to_next',
        description: 'Proceed to next scheduled collection',
        nextStep: 'navigate_to_next_location',
        alternatives: ['verify_collection_again']
      };
    }

    return {
      action: 'complete_collection',
      description: 'Proceed with waste collection',
      nextStep: 'record_collection_details',
      alternatives: ['report_issue', 'request_assistance']
    };
  }

  static getDeviceSettings(collection, options = {}) {
    return {
      audioVolume: options.audioVolume || 80,
      displayBrightness: options.displayBrightness || 90,
      vibrationIntensity: options.vibrationIntensity || 70,
      timeoutDuration: options.timeoutDuration || 30000,
      language: options.language || 'en',
      accessibilityMode: options.accessibilityMode || false,
      batteryOptimization: options.batteryOptimization || true,
      dataLogging: options.dataLogging !== false,
      offlineMode: options.offlineMode || false
    };
  }

  // Helper methods

  static getAudioFileName(feedbackType, language) {
    return `audio/${language}/${feedbackType}.mp3`;
  }

  static shouldShowQrCode(feedbackType) {
    return ['error', 'maintenance_required'].includes(feedbackType);
  }

  static generateLedSequence(feedbackType) {
    const sequences = {
      success: [
        { color: '#00FF00', duration: 500 },
        { color: '#000000', duration: 100 },
        { color: '#00FF00', duration: 500 }
      ],
      error: [
        { color: '#FF0000', duration: 200 },
        { color: '#000000', duration: 200 },
        { color: '#FF0000', duration: 200 },
        { color: '#000000', duration: 200 },
        { color: '#FF0000', duration: 200 }
      ],
      warning: [
        { color: '#FFA500', duration: 1000 },
        { color: '#000000', duration: 500 },
        { color: '#FFA500', duration: 1000 }
      ],
      maintenance: [
        { color: '#FF0000', duration: 300 },
        { color: '#FFA500', duration: 300 },
        { color: '#FF0000', duration: 300 },
        { color: '#FFA500', duration: 300 }
      ]
    };

    return sequences[feedbackType] || sequences.success;
  }

  static generateScreenLayout(collection, wasteBin, feedbackType) {
    return {
      header: {
        title: "WASTE COLLECTION",
        subtitle: wasteBin.binId,
        statusIcon: feedbackType
      },
      body: {
        mainInfo: {
          fillLevel: wasteBin.fillPercentage,
          weight: collection.wasteData.weight || 0,
          wasteType: collection.wasteData.wasteType,
          lastCollection: wasteBin.lastCollection?.date
        },
        statusBar: {
          time: new Date().toLocaleTimeString(),
          collector: collection.collector?.name,
          routeProgress: "5/12" // This would be calculated
        }
      },
      footer: {
        buttons: this.getActionButtons(feedbackType),
        helpText: "Scan QR code for details"
      }
    };
  }

  static getActionButtons(feedbackType) {
    const buttonSets = {
      normal: [
        { label: 'COLLECT', action: 'complete_collection', color: 'green' },
        { label: 'SKIP', action: 'skip_collection', color: 'yellow' },
        { label: 'REPORT', action: 'report_issue', color: 'blue' }
      ],
      error: [
        { label: 'RETRY', action: 'retry_scan', color: 'blue' },
        { label: 'MANUAL', action: 'manual_entry', color: 'yellow' },
        { label: 'HELP', action: 'get_help', color: 'red' }
      ],
      maintenance: [
        { label: 'REPORT', action: 'report_maintenance', color: 'orange' },
        { label: 'SKIP', action: 'skip_collection', color: 'yellow' },
        { label: 'CALL', action: 'call_supervisor', color: 'red' }
      ]
    };

    return buttonSets[feedbackType] || buttonSets.normal;
  }

  static getEstimatedTime(instructionType, wasteBin) {
    const baseTimes = {
      normal: 5, // minutes
      maintenance: 2,
      contamination: 8,
      full: 7
    };

    const baseTime = baseTimes[instructionType] || 5;
    const fillFactor = wasteBin.fillPercentage / 100;
    
    return Math.round(baseTime * (0.5 + fillFactor));
  }

  static getRequiredTools(instructionType) {
    const toolSets = {
      normal: ['scanner', 'collection_vehicle'],
      maintenance: ['scanner', 'camera', 'maintenance_report_form'],
      contamination: ['scanner', 'camera', 'contamination_assessment_kit', 'protective_gear'],
      full: ['scanner', 'collection_vehicle', 'cleaning_supplies']
    };

    return toolSets[instructionType] || toolSets.normal;
  }

  static getSafetyInstructions(instructionType, wasteBin) {
    const safetyGuidelines = {
      normal: [
        'Wear protective gloves',
        'Check for sharp objects',
        'Use proper lifting techniques'
      ],
      maintenance: [
        'Do not attempt collection',
        'Keep safe distance from bin',
        'Report immediately if hazardous'
      ],
      contamination: [
        'Wear full protective equipment',
        'Assess contamination type before handling',
        'Follow hazardous waste protocols if necessary'
      ],
      full: [
        'Check for overflow hazards',
        'Use team lift for heavy loads',
        'Clean any spillage immediately'
      ]
    };

    const guidelines = safetyGuidelines[instructionType] || safetyGuidelines.normal;

    // Add weight-specific safety instructions
    if (wasteBin.capacity?.current > 30) {
      guidelines.push('Heavy load - use mechanical assistance if available');
    }

    return guidelines;
  }

  // Bulk feedback generation for multiple collections
  static async generateBulkFeedback(collectionIds, scanResults, options = {}) {
    const feedbackResults = [];

    for (let i = 0; i < collectionIds.length; i++) {
      try {
        const feedback = await this.generateCollectionFeedback(
          collectionIds[i], 
          scanResults[i], 
          options
        );
        feedbackResults.push({
          collectionId: collectionIds[i],
          success: true,
          feedback: feedback
        });
      } catch (error) {
        feedbackResults.push({
          collectionId: collectionIds[i],
          success: false,
          error: error.message
        });
      }
    }

    return {
      totalProcessed: collectionIds.length,
      successful: feedbackResults.filter(r => r.success).length,
      failed: feedbackResults.filter(r => !r.success).length,
      results: feedbackResults
    };
  }

  // Real-time feedback streaming (for WebSocket connections)
  static async streamFeedback(collectionId, socketConnection, options = {}) {
    try {
      // This would integrate with WebSocket for real-time feedback
      const feedback = await this.generateCollectionFeedback(collectionId, options.scanResult, options);
      
      // Stream audio feedback
      if (feedback.audioFeedback.playSound && socketConnection) {
        socketConnection.emit('audio_feedback', {
          message: feedback.audioFeedback.message,
          audioFile: feedback.audioFeedback.audioFile,
          duration: feedback.audioFeedback.duration
        });
      }

      // Stream visual feedback
      if (feedback.visualFeedback.showDisplay && socketConnection) {
        socketConnection.emit('visual_feedback', {
          displayColor: feedback.visualFeedback.displayColor,
          displayPattern: feedback.visualFeedback.displayPattern,
          displayText: feedback.visualFeedback.displayText,
          ledSequence: feedback.visualFeedback.ledSequence
        });
      }

      // Stream instructions
      if (socketConnection) {
        socketConnection.emit('instructions', feedback.instructions);
      }

      return feedback;

    } catch (error) {
      if (socketConnection) {
        socketConnection.emit('feedback_error', { error: error.message });
      }
      throw error;
    }
  }
}

module.exports = FeedbackService;