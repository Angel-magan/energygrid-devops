// apps/auth-service/src/config/db.js
const { Pool } = require("pg");

const pool = new Pool({
  // Usamos DATABASE_URL que es el estándar de Railway en producción
  connectionString: process.env.DATABASE_URL || process.env.AUTH_DATABASE_URL,

  // Forzamos SSL únicamente en producción para evitar rechazos de conexión de la nube
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("connect", () => {
  console.log("[AUTH-DB] Conexión establecida exitosamente con PostgreSQL");
});

pool.on("error", (err) => {
  console.error("[AUTH-DB] Error inesperado en el pool de PostgreSQL:", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
