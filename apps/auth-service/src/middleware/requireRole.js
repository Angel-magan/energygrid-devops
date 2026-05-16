const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    const hasRole = roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: true, message: "Permisos insuficientes" });
    }

    next();
  };
};

module.exports = {
  requireRole,
};
