const express = require("express");
const router = express.Router();
const telemetryController = require("../controllers/telemetryController");

router.get("/telemetry", telemetryController.getTelemetry);
router.get("/telemetry/all", telemetryController.getAllTelemetry);
router.post("/telemetry", telemetryController.createTelemetry);

module.exports = router;
