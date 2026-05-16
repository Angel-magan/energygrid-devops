const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1h";

const ensureJwtSecret = () => {
  if (!jwtSecret) {
    const err = new Error("JWT_SECRET no esta configurado");
    err.statusCode = 500;
    throw err;
  }
};

const generateToken = (user) => {
  ensureJwtSecret();

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    },
    jwtSecret,
    {
      expiresIn: jwtExpiresIn,
      issuer: "eg-auth-service",
      audience: "energygrid-admin",
    }
  );
};

const verifyToken = (token) => {
  ensureJwtSecret();

  return jwt.verify(token, jwtSecret, {
    issuer: "eg-auth-service",
    audience: "energygrid-admin",
  });
};

module.exports = {
  generateToken,
  verifyToken,
};
