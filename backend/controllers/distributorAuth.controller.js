// controllers/distributorAuth.controller.js
const DistributorService = require("../services/distributor.service");

const service = new DistributorService();

// POST /register
const registerDistributor = async (req, res, next) => {
  try {
    const result = await service.register(req.body);
    res.status(201).json({
      message: "Distributor registered successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// POST /login
const loginDistributor = async (req, res, next) => {
  try {
    const result = await service.login(req.body);
    res.json({
      message: "Login successful.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /
const getAllDistributors = async (req, res, next) => {
  try {
    const distributors = await service.getAll();
    res.json(distributors);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDistributor,
  loginDistributor,
  getAllDistributors,
};
