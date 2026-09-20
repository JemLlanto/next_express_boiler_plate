const { pool } = require("../lib/mysql");

async function findByUserId(user_id) {
  const [rows] = await pool.execute(
    `
      SELECT
        item_id,
        name,
        user_id,
        quantity,
        price,
        created_at,
        updated_at
      FROM item
      WHERE user_id = ?
      ORDER BY item_id DESC
    `,
    [user_id],
  );

  return rows;
}

async function findById(item_id, user_id) {
  const [rows] = await pool.execute(
    `
      SELECT
        item_id,
        name,
        user_id,
        quantity,
        price,
        created_at,
        updated_at
      FROM item
      WHERE item_id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [item_id, user_id],
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

async function findByName(name, user_id, excludeItemId = null) {
  let query = `
    SELECT *
    FROM item
    WHERE name = ?
      AND user_id = ?
  `;

  const values = [name, user_id];

  if (excludeItemId !== null) {
    query += ` AND item_id != ?`;
    values.push(excludeItemId);
  }

  query += ` LIMIT 1`;

  const [rows] = await pool.execute(query, values);

  return rows[0] || null;
}

async function createItem(name, user_id, quantity, price) {
  console.log(
    "Creating item with name:",
    name,
    "user_id:",
    user_id,
    "quantity:",
    quantity,
    "price:",
    price,
  );

  const existingItem = await findByName(name, user_id);

  if (existingItem) {
    throw new Error("Item already exists");
  }

  const [result] = await pool.execute(
    `
      INSERT INTO item (
        name,
        user_id,
        quantity,
        price
      )
      VALUES (?, ?, ?, ?)
    `,
    [name, user_id, quantity, price],
  );

  return findById(result.insertId, user_id);
}

async function updateItem(item_id, user_id, { name, quantity, price }) {
  const fields = [];
  const values = [];

  // Check if the new name already belongs to another item
  if (name !== undefined) {
    const existingItem = await findByName(name, user_id, item_id);

    if (existingItem) {
      throw new Error("Item name already exists");
    }

    fields.push("name = ?");
    values.push(name);
  }

  if (quantity !== undefined) {
    fields.push("quantity = ?");
    values.push(quantity);
  }

  if (price !== undefined) {
    fields.push("price = ?");
    values.push(price);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(item_id, user_id);

  const [result] = await pool.execute(
    `
      UPDATE item
      SET ${fields.join(", ")}
      WHERE item_id = ?
        AND user_id = ?
    `,
    values,
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(item_id, user_id);
}

async function deleteItem(item_id, user_id) {
  const [result] = await pool.execute(
    `
      DELETE FROM item
      WHERE item_id = ?
        AND user_id = ?
    `,
    [item_id, user_id],
  );

  return result.affectedRows > 0;
}

module.exports = {
  createItem,
  findByUserId,
  findById,
  updateItem,
  deleteItem,
};
