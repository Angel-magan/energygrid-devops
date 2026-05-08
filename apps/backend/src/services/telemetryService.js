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

module.exports = { saveTelemetry };
