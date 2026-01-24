const db = require("../config/database");

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return value;
}

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users ORDER BY user_id DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM users WHERE user_id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { full_name, email, phone, date_of_birth, dob, address, gender } = req.body;

    const result = await db.query(
      "INSERT INTO users (full_name, email, phone, date_of_birth, gender, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [full_name, email, phone, normalizeDate(date_of_birth || dob), gender, address],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, date_of_birth, dob, address, gender } = req.body;

    const result = await db.query(
      "UPDATE users SET full_name = $1, email = $2, phone = $3, date_of_birth = $4, gender = $5, address = $6, updated_at = CURRENT_TIMESTAMP WHERE user_id = $7 RETURNING *",
      [full_name, email, phone, normalizeDate(date_of_birth || dob), gender, address, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM users WHERE user_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
