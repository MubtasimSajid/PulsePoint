const db = require("../config/database");

exports.getAllChambers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, u.full_name as doctor_name
      FROM chambers c
      INNER JOIN doctors d ON c.doctor_id = d.user_id
      INNER JOIN users u ON d.user_id = u.user_id
      ORDER BY c.chamber_id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getChamberById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `
      SELECT c.*, u.full_name as doctor_name
      FROM chambers c
      INNER JOIN doctors d ON c.doctor_id = d.user_id
      INNER JOIN users u ON d.user_id = u.user_id
      WHERE c.chamber_id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Chamber not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createChamber = async (req, res) => {
  try {
    const { doctor_id, name, phone, address } = req.body;

    const result = await db.query(
      "INSERT INTO chambers (doctor_id, name, phone, address) VALUES ($1, $2, $3, $4) RETURNING *",
      [doctor_id, name, phone, address],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateChamber = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctor_id, name, phone, address } = req.body;

    const result = await db.query(
      "UPDATE chambers SET doctor_id = $1, name = $2, phone = $3, address = $4 WHERE chamber_id = $5 RETURNING *",
      [doctor_id, name, phone, address, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Chamber not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteChamber = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM chambers WHERE chamber_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Chamber not found" });
    }

    res.json({ message: "Chamber deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
