const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateJwt } = require("../middleware/authenticateJwt");
const { requireRole } = require("../middleware/requireRole");
const { loginValidator } = require("../validators/authValidator");

router.get("/auth/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "eg-auth-service" });
});

router.post("/auth/login", loginValidator, authController.login);
router.get("/auth/me", authenticateJwt, authController.me);
router.get(
  "/auth/admin-check",
  authenticateJwt,
  requireRole("admin"),
  (req, res) => {
    res.status(200).json({ allowed: true, roles: req.user.roles });
  },
);

router.get(
  "/auth/admin/users",
  authenticateJwt,
  requireRole("admin"),
  authController.listAdminUsers,
);

router.post(
  "/auth/admin/users",
  authenticateJwt,
  requireRole("admin"),
  authController.createAdminUser,
);

router.put(
  "/auth/admin/users/:id",
  authenticateJwt,
  requireRole("admin"),
  authController.updateAdminUser,
);

router.patch(
  "/auth/admin/users/:id/status",
  authenticateJwt,
  requireRole("admin"),
  authController.updateAdminUserStatus,
);

module.exports = router;
