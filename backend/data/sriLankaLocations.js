const sriLankaLocations = {
  districts: {
    colombo: {
      name: 'Colombo',
      cities: [
        'Colombo 1', 'Colombo 2', 'Colombo 3', 'Colombo 4', 'Colombo 5',
        'Colombo 6', 'Colombo 7', 'Colombo 8', 'Colombo 9', 'Colombo 10',
        'Colombo 11', 'Colombo 12', 'Colombo 13', 'Colombo 14', 'Colombo 15',
        'Dehiwala', 'Mount Lavinia', 'Moratuwa', 'Kotte', 'Maharagama',
        'Nugegoda', 'Homagama', 'Padukka', 'Hanwella', 'Avissawella',
        'Seethawaka', 'Kaduwela', 'Biyagama', 'Kelaniya', 'Wattala',
        'Hendala', 'Ja Ela', 'Ekala', 'Gampaha', 'Kiribathgoda',
        'Ragama', 'Dompe', 'Minuwangoda', 'Katunayake', 'Negombo',
        'Kochchikade', 'Marawila', 'Chilaw', 'Puttalam', 'Boralesgamuwa',
        'Piliyandala', 'Kesbewa', 'Bandaragama', 'Panadura', 'Horana',
        'Ingiriya', 'Bulathsinhala', 'Mathugama', 'Agalawatta', 'Beruwala',
        'Aluthgama', 'Bentota', 'Ambalangoda', 'Elpitiya', 'Hikkaduwa'
      ]
    }
  },
  
  // Method to get cities by district
  getCitiesByDistrict: function(district) {
    const districtKey = district.toLowerCase();
    return this.districts[districtKey]?.cities || [];
  },
  
  // Method to get all districts
  getAllDistricts: function() {
    return Object.keys(this.districts).map(key => ({
      id: key,
      name: this.districts[key].name
    }));
  },
  
  // Method to validate district and city combination
  validateLocation: function(district, city) {
    const cities = this.getCitiesByDistrict(district);
    return cities.includes(city);
  },
  
  // Method to get formatted options for dropdowns
  getDistrictOptions: function() {
    return this.getAllDistricts().map(district => ({
      value: district.id,
      label: district.name
    }));
  },
  
  getCityOptions: function(district) {
    const cities = this.getCitiesByDistrict(district);
    return cities.map(city => ({
      value: city,
      label: city
    }));
  }
};

module.exports = sriLankaLocations;