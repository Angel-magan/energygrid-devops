const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { generateToken } = require("./tokenService");

const findUserByEmail = async (email) => {
  const result = await db.query(
    `
      SELECT
        u.id,
        u.email,
        u.name,
        u.password_hash,
        u.is_active,
        COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE lower(u.email) = lower($1)
      GROUP BY u.id
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0];
};

const authenticate = async ({ email, password }) => {
  const user = await findUserByEmail(email);

  if (!user || !user.is_active) {
    const err = new Error("Credenciales invalidas");
    err.statusCode = 401;
    throw err;
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    const err = new Error("Credenciales invalidas");
    err.statusCode = 401;
    throw err;
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
  };

  return {
    token: generateToken(safeUser),
    user: safeUser,
  };
};

const getUserProfile = async (userId) => {
  const result = await db.query(
    `
      SELECT
        u.id,
        u.email,
        u.name,
        u.is_active,
        COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1
      GROUP BY u.id
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0];
};

module.exports = {
  authenticate,
  getUserProfile,
};
