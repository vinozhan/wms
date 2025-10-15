/**
 * Helper functions for address formatting and manipulation
 */

/**
 * Constructs a formatted address string from an address object
 * @param {Object} addressObj - Address object with street, city, district, postalCode
 * @returns {string} - Formatted address string
 */
export const constructAddressString = (addressObj) => {
  if (!addressObj) return '';
  
  const parts = [];
  if (addressObj.street) parts.push(addressObj.street);
  if (addressObj.city) parts.push(addressObj.city);
  if (addressObj.district) parts.push(addressObj.district);
  if (addressObj.postalCode) parts.push(addressObj.postalCode);
  
  return parts.join(', ');
};

/**
 * Parses an address string into an address object
 * @param {string} addressString - Formatted address string
 * @returns {Object} - Address object with basic structure
 */
export const parseAddressString = (addressString) => {
  if (!addressString) return null;
  
  const parts = addressString.split(', ').map(part => part.trim());
  
  return {
    street: parts[0] || '',
    city: parts[1] || '',
    district: parts[2] || '',
    postalCode: parts[3] || '',
    coordinates: {
      latitude: 0,
      longitude: 0
    }
  };
};

/**
 * Validates if an address object has required fields
 * @param {Object} addressObj - Address object to validate
 * @returns {boolean} - True if address has minimum required fields
 */
export const isValidAddress = (addressObj) => {
  if (!addressObj) return false;
  return !!(addressObj.street && addressObj.city && addressObj.district);
};

/**
 * Gets a short address string (street and city only)
 * @param {Object} addressObj - Address object
 * @returns {string} - Short formatted address
 */
export const getShortAddress = (addressObj) => {
  if (!addressObj) return '';
  
  const parts = [];
  if (addressObj.street) parts.push(addressObj.street);
  if (addressObj.city) parts.push(addressObj.city);
  
  return parts.join(', ');
};