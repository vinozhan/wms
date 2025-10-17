// repositories/distributor.repository.js
const Distributor = require("../models/distributor.model"); // ✅ must match module.exports

class DistributorRepository {
  async findByEmail(email) {
    return Distributor.findOne({ email }).select("+password"); // ✅ should work now
  }

  async create(distributorData) {
    return Distributor.create(distributorData);
  }

  async findAll() {
    return Distributor.find().select("-password");
  }
}

module.exports = DistributorRepository;
