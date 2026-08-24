const jwt = require('jsonwebtoken');

const generateJWT = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'invictus_jwt_secret_key_2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = generateJWT;
