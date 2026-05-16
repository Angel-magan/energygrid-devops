const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.AUTH_DATABASE_URL,
});

pool.on("connect", () => {
  console.log("[AUTH-DB] Conexion establecida con PostgreSQL");
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
