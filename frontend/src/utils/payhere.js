// PayHere SDK Integration Utilities
import { paymentAPI } from './api';

export const loadPayHereSDK = () => {
  return new Promise((resolve, reject) => {
    // Check if PayHere is already loaded
    if (window.payhere) {
      resolve(window.payhere);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://www.payhere.lk/lib/payhere.js';
    script.async = true;

    script.onload = () => {
      if (window.payhere) {
        resolve(window.payhere);
      } else {
        reject(new Error('PayHere SDK failed to load'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load PayHere SDK'));
    };

    document.body.appendChild(script);
  });
};

// Initialize PayHere payment using backend-generated data
export const initPayHerePayment = async (paymentData, callbacks = {}) => {
  try {
    // Load PayHere SDK
    const payhere = await loadPayHereSDK();

    // Set up callbacks
    payhere.onCompleted = function(orderId) {
      console.log("Payment completed. OrderID:" + orderId);
      if (callbacks.onSuccess) callbacks.onSuccess(orderId);
    };

    payhere.onDismissed = function() {
      console.log("Payment dismissed");
      if (callbacks.onDismissed) callbacks.onDismissed();
    };

    payhere.onError = function(error) {
      console.log("Payment Error:" + error);
      if (callbacks.onError) callbacks.onError(error);
    };

    // Start payment with backend-generated data
    payhere.startPayment({
      sandbox: true, // Set to false for production
      ...paymentData,
      return_url: undefined, // Not needed for SDK
      cancel_url: undefined, // Not needed for SDK
      notify_url: import.meta.env.VITE_PAYHERE_NOTIFY_URL || "http://localhost:5000/api/payments/payhere-notify"
    });

  } catch (error) {
    console.error('PayHere initialization error:', error);
    if (callbacks.onError) callbacks.onError(error.message);
  }
};

// Main function to handle payment process
export const processPayHerePayment = async (paymentId, callbacks = {}) => {
  try {
    // Get payment data from backend
    const response = await paymentAPI.paymentPayHere(paymentId);
    
    if (response.data.success) {
      // Initialize payment with backend data
      await initPayHerePayment(response.data.paymentData, callbacks);
    } else {
      throw new Error(response.data.message || 'Failed to initialize payment');
    }
  } catch (error) {
    console.error('Payment process error:', error);
    if (callbacks.onError) {
      callbacks.onError(error.response?.data?.message || error.message || 'Unable to initialize payment');
    }
  }
};

export default {
  loadPayHereSDK,
  initPayHerePayment,
  processPayHerePayment
};