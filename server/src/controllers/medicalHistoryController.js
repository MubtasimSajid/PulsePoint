const db = require("../config/database");

exports.getAllMedicalHistory = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT mh.*,
        u_patient.full_name as patient_name,
        u_doctor.full_name as doctor_name
      FROM medical_history mh
      INNER JOIN patients p ON mh.patient_id = p.user_id
      INNER JOIN users u_patient ON p.user_id = u_patient.user_id
      INNER JOIN doctors d ON mh.doctor_id = d.user_id
      INNER JOIN users u_doctor ON d.user_id = u_doctor.user_id
      ORDER BY mh.visit_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMedicalHistoryByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await db.query(
      `
      SELECT mh.*,
        u_doctor.full_name as doctor_name
      FROM medical_history mh
      INNER JOIN doctors d ON mh.doctor_id = d.user_id
      INNER JOIN users u_doctor ON d.user_id = u_doctor.user_id
      WHERE mh.patient_id = $1
      ORDER BY mh.visit_date DESC
    `,
      [patientId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMedicalHistory = async (req, res) => {
  try {
    const { patient_id, doctor_id, visit_date, diagnosis, notes } = req.body;

    const result = await db.query(
      `INSERT INTO medical_history (patient_id, doctor_id, visit_date, diagnosis, notes) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patient_id, doctor_id, visit_date, diagnosis, notes],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, doctor_id, visit_date, diagnosis, notes } = req.body;

    const result = await db.query(
      `UPDATE medical_history 
       SET patient_id = $1, doctor_id = $2, visit_date = $3, diagnosis = $4, notes = $5
       WHERE history_id = $6 RETURNING *`,
      [patient_id, doctor_id, visit_date, diagnosis, notes, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Medical history not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM medical_history WHERE history_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Medical history not found" });
    }

    res.json({ message: "Medical history deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
