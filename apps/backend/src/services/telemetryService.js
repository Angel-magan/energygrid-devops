const db = require("../config/db");

const saveTelemetry = async (data) => {
  const { district_id, substation_id, consumption_kw, timestamp } = data;
  const query = `
    INSERT INTO telemetry (district_id, substation_id, consumption_kw, timestamp)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [district_id, substation_id, consumption_kw, timestamp];
  const result = await db.query(query, values);
  return result.rows[0];
};

//Obtener los datos de telemetría para un distrito específico
const getLatestTelemetry = async (limit = 50) => {
  const query = `
    SELECT id, district_id, substation_id, consumption_kw, timestamp 
    FROM telemetry 
    ORDER BY timestamp DESC 
    LIMIT $1;
  `;
  const result = await db.query(query, [limit]);
  return result.rows;
};

// Obtener todos los registros de telemetría (sin límite)
const getAllTelemetry = async () => {
  const query = `
    SELECT id, district_id, substation_id, consumption_kw, timestamp
    FROM telemetry
    ORDER BY timestamp DESC;
  `;
  const result = await db.query(query);
  return result.rows;
};
module.exports = { saveTelemetry, getLatestTelemetry, getAllTelemetry };
