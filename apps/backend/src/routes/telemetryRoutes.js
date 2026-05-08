const express = require("express");
const router = express.Router();
const telemetryController = require("../controllers/telemetryController");

router.post("/telemetry", telemetryController.createTelemetry);

module.exports = router;
