const express = require("express");
const router = express.Router();
const systemController = require("../controllers/systemController");

router.get("/system/status", systemController.getStatus);

module.exports = router;
