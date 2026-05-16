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
router.get("/auth/admin-check", authenticateJwt, requireRole("admin"), (req, res) => {
  res.status(200).json({ allowed: true, roles: req.user.roles });
});

module.exports = router;
