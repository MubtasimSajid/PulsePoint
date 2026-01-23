const db = require("../config/database");

exports.getAllDepartments = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM departments ORDER BY dept_id DESC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "SELECT * FROM departments WHERE dept_id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    const result = await db.query(
      "INSERT INTO departments (name) VALUES ($1) RETURNING *",
      [name],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const result = await db.query(
      "UPDATE departments SET name = $1 WHERE dept_id = $2 RETURNING *",
      [name, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM departments WHERE dept_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
