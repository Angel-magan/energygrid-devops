const express = require("express");
const router = express.Router();
const systemController = require("../controllers/systemController");

router.get("/system/status", systemController.getStatus);

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});


module.exports = router;
