// routes/distributorAuth.routes.js
const express = require("express");
const {
  registerDistributor,
  loginDistributor,
  getAllDistributors,
} = require("../controllers/distributorAuth.controller");

const router = express.Router();

router.post("/register", registerDistributor);
router.post("/login", loginDistributor);
router.get("/", getAllDistributors);

module.exports = router;
