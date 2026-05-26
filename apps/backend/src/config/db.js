const { Pool } = require("pg");
const { appendLog } = require("../services/logService");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("connect", () => {
  console.log("[DB Pool] Nuevo cliente de conexión acoplado al contenedor.");
});

const SLOW_QUERY_THRESHOLD_MS = 150;

module.exports = {
  pool,
  /**
   * Interceptor personalizado de consultas
   * Mide el tiempo de ejecución y registra alertas si la base de datos se ralentiza.
   */
  query: async (text, params) => {
    const start = process.hrtime.bigint();

    try {
      const result = await pool.query(text, params);

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;

      if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
        const cleanSql = text.replace(/\s+/g, " ").trim();

        appendLog({
          level: "WARN",
          service: "Database (Slow Query Log)",
          message: `🐢 Consulta lenta detectada (${durationMs.toFixed(1)} ms) -> SQL: "${cleanSql}"`,
        });
      }

      return result;
    } catch (error) {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;

      appendLog({
        level: "ERROR",
        service: "Database Core",
        message: `💥 Fallo en consulta SQL después de ${durationMs.toFixed(1)} ms. Error: ${error.message}`,
      });

      throw error;
    }
  },
};
