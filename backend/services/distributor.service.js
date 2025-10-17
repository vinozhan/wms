// services/distributor.service.js
const DistributorRepository = require("../repositories/distributor.repository");
const { generateToken } = require("../utils/jwt.util");

class DistributorService {
  constructor() {
    this.repo = new DistributorRepository();
  }

  async register({ name, email, password, address }) {
    if (!name || !email || !password || !address)
      throw new Error("All fields are required.");

    const existing = await this.repo.findByEmail(email);
    if (existing) throw new Error("Email already registered.");

    const distributor = await this.repo.create({ name, email, password, address });
    const token = generateToken(distributor);

    return {
      distributor: {
        id: distributor._id,
        name: distributor.name,
        email: distributor.email,
        address: distributor.address,
      },
      token,
    };
  }

  async login({ email, password }) {
    if (!email || !password)
      throw new Error("Email and password required.");

    const distributor = await this.repo.findByEmail(email);
    if (!distributor) throw new Error("Invalid email or password.");

    const isMatch = await distributor.comparePassword(password);
    if (!isMatch) throw new Error("Invalid email or password.");

    const token = generateToken(distributor);

    return {
      distributor: {
        id: distributor._id,
        name: distributor.name,
        email: distributor.email,
        address: distributor.address,
      },
      token,
    };
  }

  async getAll() {
    return this.repo.findAll();
  }
}

module.exports = DistributorService;
