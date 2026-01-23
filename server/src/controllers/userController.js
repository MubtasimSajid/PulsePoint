const db = require("../config/database");

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
    const { full_name, email, phone, dob, address } = req.body;

    const result = await db.query(
      "INSERT INTO users (full_name, email, phone, dob, address) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [full_name, email, phone, dob, address],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, dob, address } = req.body;

    const result = await db.query(
      "UPDATE users SET full_name = $1, email = $2, phone = $3, dob = $4, address = $5 WHERE user_id = $6 RETURNING *",
      [full_name, email, phone, dob, address, id],
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
