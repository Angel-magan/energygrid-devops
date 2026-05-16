const { verifyToken } = require("../services/tokenService");

const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: true, message: "Token requerido" });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: true, message: "Token invalido o expirado" });
  }
};

module.exports = {
  authenticateJwt,
};
