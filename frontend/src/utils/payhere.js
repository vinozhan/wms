// PayHere SDK Integration Utilities

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

export const createPayHerePayment = (paymentData) => {
  const {
    payment,
    onSuccess,
    onError,
    onDismissed
  } = paymentData;

  // PayHere configuration for sandbox
  const paymentObject = {
    sandbox: true, // Set to false for production
    merchant_id: import.meta.env.VITE_PAYHERE_MERCHANT_ID || "121XXXX", // Replace with your merchant ID
    return_url: window.location.origin + "/payments?status=success",
    cancel_url: window.location.origin + "/payments?status=cancelled",
    notify_url: import.meta.env.VITE_PAYHERE_NOTIFY_URL || "http://localhost:5000/api/payments/payhere-notify",
    order_id: payment.paymentId,
    items: `Waste Management Services - Invoice ${payment.invoiceNumber}`,
    amount: payment.totals.totalAmount.toFixed(2),
    currency: payment.totals.currency,
    hash: generateHash(payment), // This should be generated on your backend
    first_name: payment.user?.name?.split(' ')[0] || 'Customer',
    last_name: payment.user?.name?.split(' ').slice(1).join(' ') || '',
    email: payment.user?.email || '',
    phone: payment.user?.phone || '',
    address: payment.user?.address?.street || '',
    city: payment.user?.address?.city || 'Colombo',
    country: "Sri Lanka",
    delivery_address: payment.user?.address?.street || '',
    delivery_city: payment.user?.address?.city || 'Colombo',
    delivery_country: "Sri Lanka"
  };

  // Load PayHere SDK and initialize payment
  loadPayHereSDK()
    .then((payhere) => {
      // Set up callbacks
      payhere.onCompleted = function(orderId) {
        console.log("Payment completed. OrderID:" + orderId);
        if (onSuccess) onSuccess(orderId);
      };

      payhere.onDismissed = function() {
        console.log("Payment dismissed");
        if (onDismissed) onDismissed();
      };

      payhere.onError = function(error) {
        console.log("Payment Error:" + error);
        if (onError) onError(error);
      };

      // Start payment
      payhere.startPayment(paymentObject);
    })
    .catch((error) => {
      console.error('PayHere SDK Error:', error);
      if (onError) onError(error.message);
    });
};

// Generate hash for payment verification (simplified version)
// In production, this should be generated on your backend
const generateHash = (payment) => {
  // This is a simplified hash generation for demo purposes
  // In production, use proper HMAC-SHA256 with your secret key
  const merchant_id = import.meta.env.VITE_PAYHERE_MERCHANT_ID || "121XXXX";
  const order_id = payment.paymentId;
  const amount = payment.totals.totalAmount.toFixed(2);
  const currency = payment.totals.currency;
  
  // Simple concatenation (replace with proper hash in production)
  return btoa(`${merchant_id}${order_id}${amount}${currency}`);
};

export default {
  loadPayHereSDK,
  createPayHerePayment
};