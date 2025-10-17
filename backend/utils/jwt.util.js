// utils/jwt.util.js
const jwt = require("jsonwebtoken");

function generateToken(distributor) {
  return jwt.sign(
    { id: distributor._id, email: distributor.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

module.exports = { generateToken };
