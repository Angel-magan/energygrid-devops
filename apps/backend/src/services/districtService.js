const db = require("../config/db");

const getAllDistricts = async () => {
  const query = `
    SELECT id, name, capacity_max_kw
    FROM districts
    ORDER BY name ASC;
  `;
  const result = await db.query(query);
  return result.rows;
};

const getDistrictById = async (id) => {
  const query = `
    SELECT id, name, capacity_max_kw
    FROM districts
    WHERE id = $1
    LIMIT 1;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

const updateDistrictCapacity = async (id, capacityMaxKw) => {
  const query = `
    UPDATE districts
    SET capacity_max_kw = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, name, capacity_max_kw;
  `;
  const result = await db.query(query, [id, capacityMaxKw]);
  return result.rows[0] || null;
};

module.exports = {
  getAllDistricts,
  getDistrictById,
  updateDistrictCapacity,
};
