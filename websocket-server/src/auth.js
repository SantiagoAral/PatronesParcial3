const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'supersecret';

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, secret);
    return payload;
  } catch (e) {
    return null;
  }
}

module.exports = { verifyToken };
