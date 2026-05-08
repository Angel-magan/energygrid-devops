const telemetryService = require("../services/telemetryService");

const createTelemetry = async (req, res) => {
  try {
    const { district_id, consumption_kw } = req.body;

    // Validación básica (puedes expandirla)
    if (!district_id || consumption_kw < 0) {
      console.warn(
        `[WARNING] Invalid payload received: ${JSON.stringify(req.body)}`,
      );
      return res.status(400).json({ error: "Invalid data" });
    }

    const savedData = await telemetryService.saveTelemetry(req.body);
    console.log(`[INFO] Telemetry stored for district: ${district_id}`);
    res.status(201).json(savedData);
  } catch (error) {
    console.error("[ERROR] Database insertion failed:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { createTelemetry };
