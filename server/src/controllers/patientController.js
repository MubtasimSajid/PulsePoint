const db = require("../config/database");

function sanitizeHeightCm(value) {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return null;
  return num >= 30 && num <= 300 ? num : null;
}

function sanitizeWeightKg(value) {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return null;
  return num > 0 && num <= 500 ? num : null;
}

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return value;
}

exports.getAllPatients = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.*, p.patient_code, p.height_cm, p.weight_kg, p.bmi, p.blood_group, p.medical_notes, p.emergency_contact
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
      SELECT u.*, p.patient_code, p.height_cm, p.weight_kg, p.bmi, p.blood_group, p.medical_notes, p.emergency_contact
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
      date_of_birth,
      dob,
      gender,
      address,
      patient_code,
      height_cm,
      weight_kg,
      blood_group,
      medical_notes,
      emergency_contact,
    } = req.body;

    const safeHeight = sanitizeHeightCm(height_cm);
    const safeWeight = sanitizeWeightKg(weight_kg);

    // Create user
    const userResult = await client.query(
      "INSERT INTO users (full_name, email, phone, date_of_birth, gender, address, role) VALUES ($1, $2, $3, $4, $5, $6, 'patient') RETURNING user_id",
      [full_name, email, phone, normalizeDate(date_of_birth || dob), gender, address],
    );
    const userId = userResult.rows[0].user_id;

    // Create patient
    await client.query(
      "INSERT INTO patients (user_id, patient_code, height_cm, weight_kg, blood_group, medical_notes, emergency_contact) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [userId, patient_code, safeHeight, safeWeight, blood_group, medical_notes, emergency_contact],
    );

    await client.query("COMMIT");

    const result = await db.query(
      `
      SELECT u.*, p.patient_code, p.height_cm, p.weight_kg, p.bmi, p.blood_group, p.medical_notes, p.emergency_contact
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
      date_of_birth,
      dob,
      gender,
      address,
      patient_code,
      height_cm,
      weight_kg,
      blood_group,
      medical_notes,
      emergency_contact,
    } = req.body;

    // Fetch existing user to preserve values when not provided
    const existingUser = await client.query(
      "SELECT full_name, email, phone, date_of_birth, gender, address FROM users WHERE user_id = $1",
      [id],
    );

    if (existingUser.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const current = existingUser.rows[0];
    const nextFullName = full_name ?? current.full_name;
    const nextEmail = email ?? current.email;
    const nextPhone = phone ?? current.phone;
    const nextDob = normalizeDate(date_of_birth || dob) ?? current.date_of_birth;
    const nextGender = gender ?? current.gender;
    const nextAddress = address ?? current.address;

    await client.query(
      "UPDATE users SET full_name = $1, email = $2, phone = $3, date_of_birth = $4, gender = $5, address = $6, updated_at = CURRENT_TIMESTAMP WHERE user_id = $7",
      [nextFullName, nextEmail, nextPhone, nextDob, nextGender, nextAddress, id],
    );

    const safeHeight = sanitizeHeightCm(height_cm);
    const safeWeight = sanitizeWeightKg(weight_kg);

    const updateResult = await client.query(
      "UPDATE patients SET patient_code = $1, height_cm = $2, weight_kg = $3, blood_group = $4, medical_notes = $5, emergency_contact = $6 WHERE user_id = $7 RETURNING user_id",
      [patient_code, safeHeight, safeWeight, blood_group, medical_notes, emergency_contact, id],
    );

    if (updateResult.rowCount === 0) {
      // If patient record is missing, create it to keep user/profile in sync
      await client.query(
        "INSERT INTO patients (user_id, patient_code, height_cm, weight_kg, blood_group, medical_notes, emergency_contact) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, patient_code, safeHeight, safeWeight, blood_group, medical_notes, emergency_contact],
      );
    }

    await client.query("COMMIT");

    const result = await db.query(
      `
      SELECT u.*, p.patient_code, p.height_cm, p.weight_kg, p.bmi, p.blood_group, p.medical_notes, p.emergency_contact
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
