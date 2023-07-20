const crypto = require('crypto');

function generateJWTSecret() {
  const secret = crypto.randomBytes(64).toString('hex');
  console.log('Generated JWT Secret:', secret);
}

generateJWTSecret();
