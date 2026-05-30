const express = require("express");
const router = express.Router();
const systemController = require("../controllers/systemController");

router.get("/system/status", systemController.getStatus);
router.post("/system/chaos", systemController.handleChaosEndpoint);
router.get("/system/chaos-state", systemController.getChaosState);
module.exports = router;