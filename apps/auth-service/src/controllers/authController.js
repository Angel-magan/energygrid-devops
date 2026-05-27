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

const listAdminUsers = async (req, res, next) => {
  try {
    const users = await authService.getAdminUsers();
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
};

const createAdminUser = async (req, res, next) => {
  try {
    const user = await authService.createAdminUser(req.body);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

const updateAdminUser = async (req, res, next) => {
  try {
    const user = await authService.updateAdminUser(req.params.id, req.body);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

const updateAdminUserStatus = async (req, res, next) => {
  try {
    const { is_active: isActive } = req.body;
    const user = await authService.setAdminUserStatus(req.params.id, isActive);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  me,
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  updateAdminUserStatus,
};
