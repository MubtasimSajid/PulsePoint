const pool = require("../config/database");

exports.createRecord = async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, record_type, record_date, description, file_url } = req.body;
    const patient_id = req.user.userId; // Provided by auth middleware

    if (!title || !record_type) {
      return res.status(400).json({ error: "Title and Record Type are required" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO medical_records (patient_id, title, record_type, record_date, description, file_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [patient_id, title, record_type, record_date || new Date(), description || "", file_url || ""]
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create Record Error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

exports.getPatientRecords = async (req, res) => {
  try {
    const patient_id = req.user.userId;
    const result = await pool.query(
      `SELECT * FROM medical_records WHERE patient_id = $1 ORDER BY record_date DESC, created_at DESC`,
      [patient_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get Records Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteRecord = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const patient_id = req.user.userId;

    const check = await client.query(
      "SELECT * FROM medical_records WHERE record_id = $1 AND patient_id = $2",
      [id, patient_id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Record not found or unauthorized" });
    }

    await client.query("DELETE FROM medical_records WHERE record_id = $1", [id]);
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Delete Record Error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};
