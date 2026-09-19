const bcrypt = require("bcryptjs");
const { customAlphabet } = require("nanoid");

const { pool } = require("../lib/mysql");

async function createUser(email, password) {
  const existing = await findByEmail(email);

  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const userId = customAlphabet(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    12,
  )();

  console.log("Generated User ID:", userId);

  const [result] = await pool.execute(
    `
      INSERT INTO users (
        user_id,
        email,
        password,
        refresh_tokens
      )
      VALUES (?, ?, ?, ?)
    `,
    [userId, email, passwordHash, JSON.stringify([])],
  );

  return {
    user_id: userId,
    email,
    password: passwordHash,
    refresh_tokens: [],
  };
}

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  );

  if (rows.length === 0) {
    return null;
  }

  return parseUser(rows[0]);
}

async function findById(user_id) {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM users
      WHERE user_id = ?
      LIMIT 1
    `,
    [user_id],
  );

  if (rows.length === 0) {
    return null;
  }

  return parseUser(rows[0]);
}

async function validatePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

async function addRefreshToken(user, token) {
  const refreshTokens = user.refresh_tokens || [];

  const updated = [...refreshTokens, token];

  await pool.execute(
    `
      UPDATE users
      SET refresh_tokens = ?
      WHERE user_id = ?
    `,
    [JSON.stringify(updated), user.user_id],
  );
}

async function removeRefreshToken(user, token) {
  const refreshTokens = user.refresh_tokens || [];

  const updated = refreshTokens.filter((t) => t !== token);

  await pool.execute(
    `
      UPDATE users
      SET refresh_tokens = ?
      WHERE user_id = ?
    `,
    [JSON.stringify(updated), user.user_id],
  );
}

function hasRefreshToken(user, token) {
  const refreshTokens = user.refresh_tokens || [];

  return refreshTokens.includes(token);
}

function parseUser(user) {
  return {
    ...user,
    refresh_tokens:
      typeof user.refresh_tokens === "string"
        ? JSON.parse(user.refresh_tokens)
        : user.refresh_tokens || [],
  };
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  validatePassword,
  addRefreshToken,
  removeRefreshToken,
  hasRefreshToken,
};
