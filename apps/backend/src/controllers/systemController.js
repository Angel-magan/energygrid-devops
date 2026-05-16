const {
  getSystemMetrics,
  getSystemStatus,
} = require("../services/systemService");
const { getLogs, appendLog } = require("../services/logService");

const getStatus = async (req, res) => {
  try {
    const frontendHealthUrl =
      process.env.FRONTEND_HEALTH_URL || "http://eg-frontend:5173";

    const [status, metrics] = await Promise.all([
      getSystemStatus({ frontendHealthUrl }),
      getSystemMetrics(),
    ]);

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      services: status.services,
      metrics,
      healthChecks: status.healthChecks,
      scaling: status.scaling,
      logs: getLogs(20),
    });
  } catch (error) {
    appendLog({
      level: "ERROR",
      service: "System",
      message: `Fallo obteniendo status: ${error?.message || "unknown"}`,
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getStatus };
