const telemetryService = require("../services/telemetryService");
const { appendLog } = require("../services/logService");

const isSuspicious = (value) => {
  if (typeof value !== "string") return false;
  const s = value.toLowerCase();
  return (
    s.includes("--") ||
    s.includes("/*") ||
    s.includes("*/") ||
    s.includes(";") ||
    s.includes("'") ||
    /\b(or|and)\b\s+\d+\s*=\s*\d+/.test(s) ||
    /\b(drop|truncate|insert|update|delete)\b/.test(s)
  );
};

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

    // Logs operacionales (para el panel DevOps)
    if (isSuspicious(district_id) || isSuspicious(req.body?.substation_id)) {
      appendLog({
        level: "WARN",
        service: "Backend API",
        message: `Posible entrada sospechosa en telemetría: district='${district_id}' substation='${req.body?.substation_id}'`,
      });
    }

    const consumption = Number(consumption_kw);
    if (Number.isFinite(consumption) && consumption >= 4750) {
      appendLog({
        level: "WARN",
        service: "Backend API",
        message: `Alta carga detectada: ${district_id} · ${consumption.toFixed(2)} kW`,
      });
    }

    res.status(201).json(savedData);
  } catch (error) {
    console.error("[ERROR] Database insertion failed:", error.message);
    appendLog({
      level: "ERROR",
      service: "Backend API",
      message: `Fallo inserción telemetría: ${error?.message || "unknown"}`,
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getTelemetry = async (req, res) => {
  try {
    const data = await telemetryService.getLatestTelemetry(50);
    res.status(200).json(data);
  } catch (error) {
    console.error("[ERROR] Fetching telemetry:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { createTelemetry, getTelemetry };
