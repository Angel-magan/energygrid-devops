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

    // Validación básica del Payload
    if (!district_id || consumption_kw < 0) {
      // Usamos appendLog en lugar de un console.warn suelto para que el frontend lo registre
      appendLog({
        level: "WARN",
        service: "Backend API",
        message: `Payload rechazado por datos inválidos: ${JSON.stringify(req.body)}`,
      });
      return res.status(400).json({ error: "Invalid data" });
    }

    // Guardamos en la base de datos de telemetría operativa
    const savedData = await telemetryService.saveTelemetry(req.body);

    // ❌ ELIMINADO: console.log(`[INFO] Telemetry stored...`);
    // Explicación: Ya no imprimimos texto por cada envío exitoso de 5s para salvar la consola.

    // 1. Auditoría de Seguridad: Si detectamos patrones extraños de SQL Injection
    if (isSuspicious(district_id) || isSuspicious(req.body?.substation_id)) {
      appendLog({
        level: "WARN",
        service: "Backend API",
        message: `ALERTA DE SEGURIDAD: Inyección sospechosa mitigada en distrito='${district_id}'`,
      });
    }

    // 2. Auditoría de Operación: Alta carga en el Sector Occidente
    const consumption = Number(consumption_kw);
    if (Number.isFinite(consumption) && consumption >= 4750) {
      appendLog({
        level: "WARN",
        service: "Backend API",
        message: `⚡ SOBRECARGA CRÍTICA DETECTADA: ${district_id} operando a ${consumption.toFixed(2)} kW`,
      });
    }

    res.status(201).json(savedData);
  } catch (error) {
    // Si la base de datos se cae o falla la query, esto SÍ es un error crítico
    appendLog({
      level: "ERROR",
      service: "Database API",
      message: `Fallo catastrófico en inserción de telemetría: ${error.message}`,
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

// const getAllTelemetry = async (req, res) => {
//   try {
//     const data = await telemetryService.getAllTelemetry();
//     res.status(200).json(data);
//   } catch (error) {
//     console.error("[ERROR] Fetching all telemetry:", error.message);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const getAllTelemetry = async (req, res) => {
  try {
    // 1. Capturamos los query params de la URL. Si no vienen, por defecto es página 1 y límite de 20.
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    // Validamos que no metan números negativos o cero
    if (page < 1 || limit < 1) {
      return res
        .status(400)
        .json({ error: "La página y el límite deben ser mayores a 0" });
    }

    // 2. Le pasamos page y limit a tu servicio
    const result = await telemetryService.getAllTelemetryPaginated(page, limit);

    // 3. Respondemos con los datos y los metadatos de control para tu front
    res.status(200).json({
      data: result.data, // Los 20 registros de la telemetría
      pagination: {
        totalItems: result.totalItems, // Total de datos en la BD (ej. 1250)
        totalPages: result.totalPages, // Total de páginas (ej. 1250 / 20 = 63)
        currentPage: page, // Página actual
        limit: limit, // Cantidad por página
      },
    });
  } catch (error) {
    console.error("[ERROR] Fetching paginated telemetry:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getTelemetryPeaks = async (req, res) => {
  try {
    const data = await telemetryService.getTelemetryPeaks();
    res.status(200).json(data);
  } catch (error) {
    console.error("[ERROR] Fetching telemetry peaks:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createTelemetry,
  getTelemetry,
  getAllTelemetry,
  getTelemetryPeaks,
};
