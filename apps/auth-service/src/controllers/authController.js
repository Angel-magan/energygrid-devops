const authService = require("../services/authService");

const login = async (req, res, next) => {
  try {
    const authResult = await authService.authenticate(req.body);
    res.status(200).json(authResult);
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: true, message: "Token invalido" });
    }

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  me,
};
