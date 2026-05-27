const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { generateToken } = require("./tokenService");

const mapUserRow = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    is_active: user.is_active,
    roles: user.roles || [],
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

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
    [email],
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
    [userId],
  );

  return result.rows[0];
};

const getAdminUsers = async () => {
  const result = await db.query(
    `
      SELECT
        u.id,
        u.email,
        u.name,
        u.is_active,
        u.created_at,
        u.updated_at,
        COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE EXISTS (
        SELECT 1
        FROM user_roles ur_admin
        JOIN roles r_admin ON r_admin.id = ur_admin.role_id
        WHERE ur_admin.user_id = u.id
          AND r_admin.name = 'admin'
      )
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `,
  );

  return result.rows.map(mapUserRow);
};

const getAdminUserById = async (userId) => {
  const result = await db.query(
    `
      SELECT
        u.id,
        u.email,
        u.name,
        u.is_active,
        u.created_at,
        u.updated_at,
        COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1
        AND EXISTS (
          SELECT 1
          FROM user_roles ur_admin
          JOIN roles r_admin ON r_admin.id = ur_admin.role_id
          WHERE ur_admin.user_id = u.id
            AND r_admin.name = 'admin'
        )
      GROUP BY u.id
      LIMIT 1
    `,
    [userId],
  );

  return mapUserRow(result.rows[0]);
};

const createAdminUser = async ({ email, name, password }) => {
  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();
  const cleanName = String(name || "").trim();
  const cleanPassword = String(password || "");

  if (!cleanEmail || !cleanName || !cleanPassword) {
    const err = new Error("Email, nombre y contrasena son obligatorios");
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(cleanPassword, 10);
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
        INSERT INTO users (email, name, password_hash, is_active)
        VALUES ($1, $2, $3, TRUE)
        RETURNING id, email, name, is_active, created_at, updated_at
      `,
      [cleanEmail, cleanName, hashedPassword],
    );

    const roleResult = await client.query(
      `
        SELECT id
        FROM roles
        WHERE name = 'admin'
        LIMIT 1
      `,
    );

    if (!roleResult.rows[0]) {
      throw new Error("No se encontro el rol admin en la base de datos");
    }

    await client.query(
      `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [userResult.rows[0].id, roleResult.rows[0].id],
    );

    await client.query("COMMIT");

    return getAdminUserById(userResult.rows[0].id);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      const duplicate = new Error("Ya existe un usuario con ese email");
      duplicate.statusCode = 409;
      throw duplicate;
    }
    throw err;
  } finally {
    client.release();
  }
};

const updateAdminUser = async (userId, { email, name, password }) => {
  const currentUser = await getAdminUserById(userId);

  if (!currentUser) {
    const err = new Error("Usuario admin no encontrado");
    err.statusCode = 404;
    throw err;
  }

  const cleanEmail =
    email === undefined
      ? currentUser.email
      : String(email || "")
          .trim()
          .toLowerCase();
  const cleanName =
    name === undefined ? currentUser.name : String(name || "").trim();
  const cleanPassword = password === undefined ? null : String(password || "");

  if (!cleanEmail || !cleanName) {
    const err = new Error("Email y nombre son obligatorios");
    err.statusCode = 400;
    throw err;
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    if (cleanPassword) {
      const hashedPassword = await bcrypt.hash(cleanPassword, 10);
      await client.query(
        `
          UPDATE users
          SET email = $1,
              name = $2,
              password_hash = $3,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `,
        [cleanEmail, cleanName, hashedPassword, userId],
      );
    } else {
      await client.query(
        `
          UPDATE users
          SET email = $1,
              name = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `,
        [cleanEmail, cleanName, userId],
      );
    }

    await client.query("COMMIT");

    return getAdminUserById(userId);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      const duplicate = new Error("Ya existe un usuario con ese email");
      duplicate.statusCode = 409;
      throw duplicate;
    }
    throw err;
  } finally {
    client.release();
  }
};

const setAdminUserStatus = async (userId, isActive) => {
  const currentUser = await getAdminUserById(userId);

  if (!currentUser) {
    const err = new Error("Usuario admin no encontrado");
    err.statusCode = 404;
    throw err;
  }

  const result = await db.query(
    `
      UPDATE users
      SET is_active = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, name, is_active, created_at, updated_at
    `,
    [Boolean(isActive), userId],
  );

  return getAdminUserById(result.rows[0].id);
};

module.exports = {
  authenticate,
  getUserProfile,
  getAdminUsers,
  getAdminUserById,
  createAdminUser,
  updateAdminUser,
  setAdminUserStatus,
};
