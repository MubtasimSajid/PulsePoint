const db = require("../config/database");

exports.getAllPatients = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.*, p.patient_code, p.height_cm, p.weight_kg, p.blood_group, p.medical_notes
      FROM users u
      INNER JOIN patients p ON u.user_id = p.user_id
      ORDER BY u.user_id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `
      SELECT u.*, p.patient_code, p.height_cm, p.weight_kg, p.blood_group, p.medical_notes
      FROM users u
      INNER JOIN patients p ON u.user_id = p.user_id
      WHERE u.user_id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPatient = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const {
      full_name,
      email,
      phone,
      dob,
      address,
      patient_code,
      height_cm,
      weight_kg,
      blood_group,
      medical_notes,
    } = req.body;

    // Create user
    const userResult = await client.query(
      "INSERT INTO users (full_name, email, phone, dob, address) VALUES ($1, $2, $3, $4, $5) RETURNING user_id",
      [full_name, email, phone, dob, address],
    );
    const userId = userResult.rows[0].user_id;

    // Create patient
    await client.query(
      "INSERT INTO patients (user_id, patient_code, height_cm, weight_kg, blood_group, medical_notes) VALUES ($1, $2, $3, $4, $5, $6)",
      [userId, patient_code, height_cm, weight_kg, blood_group, medical_notes],
    );

    await client.query("COMMIT");

    const result = await db.query(
      `
      SELECT u.*, p.patient_code, p.height_cm, p.weight_kg, p.blood_group, p.medical_notes
      FROM users u
      INNER JOIN patients p ON u.user_id = p.user_id
      WHERE u.user_id = $1
    `,
      [userId],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.updatePatient = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const {
      full_name,
      email,
      phone,
      dob,
      address,
      patient_code,
      height_cm,
      weight_kg,
      blood_group,
      medical_notes,
    } = req.body;

    await client.query(
      "UPDATE users SET full_name = $1, email = $2, phone = $3, dob = $4, address = $5 WHERE user_id = $6",
      [full_name, email, phone, dob, address, id],
    );

    await client.query(
      "UPDATE patients SET patient_code = $1, height_cm = $2, weight_kg = $3, blood_group = $4, medical_notes = $5 WHERE user_id = $6",
      [patient_code, height_cm, weight_kg, blood_group, medical_notes, id],
    );

    await client.query("COMMIT");

    const result = await db.query(
      `
      SELECT u.*, p.patient_code, p.height_cm, p.weight_kg, p.blood_group, p.medical_notes
      FROM users u
      INNER JOIN patients p ON u.user_id = p.user_id
      WHERE u.user_id = $1
    `,
      [id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM patients WHERE user_id = $1", [id]);
    await db.query("DELETE FROM users WHERE user_id = $1", [id]);

    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
