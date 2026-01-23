const db = require("../config/database");

exports.getAllSpecializations = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM specializations ORDER BY spec_id DESC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSpecializationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "SELECT * FROM specializations WHERE spec_id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Specialization not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSpecialization = async (req, res) => {
  try {
    const { name } = req.body;

    const result = await db.query(
      "INSERT INTO specializations (name) VALUES ($1) RETURNING *",
      [name],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSpecialization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const result = await db.query(
      "UPDATE specializations SET name = $1 WHERE spec_id = $2 RETURNING *",
      [name, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Specialization not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSpecialization = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM specializations WHERE spec_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Specialization not found" });
    }

    res.json({ message: "Specialization deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
