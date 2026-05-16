const { Pool } = require("pg");
const { appendLog } = require("../services/logService");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("[DB] Conexión establecida con PostgreSQL");
  appendLog({
    level: "INFO",
    service: "PostgreSQL",
    message: "Conexión establecida con PostgreSQL",
  });
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
