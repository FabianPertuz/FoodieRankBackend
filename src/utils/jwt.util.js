const jwt = require('jsonwebtoken');

function signToken(user) {
  const payload = {
    sub: user._id,
    role: user.role
  };
  const secret = process.env.JWT_SECRET || 'change_this_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

module.exports = { signToken };
