const db = require("../config/database");

exports.getAllAppointments = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        a.*,
        u_patient.full_name as patient_name,
        u_doctor.full_name as doctor_name,
        h.name as hospital_name,
        c.name as chamber_name
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.user_id
      INNER JOIN users u_patient ON p.user_id = u_patient.user_id
      INNER JOIN doctors d ON a.doctor_id = d.user_id
      INNER JOIN users u_doctor ON d.user_id = u_doctor.user_id
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
      LEFT JOIN chambers c ON a.chamber_id = c.chamber_id
      ORDER BY a.appt_date DESC, a.appt_time DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `
      SELECT 
        a.*,
        u_patient.full_name as patient_name,
        u_doctor.full_name as doctor_name,
        h.name as hospital_name,
        c.name as chamber_name
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.user_id
      INNER JOIN users u_patient ON p.user_id = u_patient.user_id
      INNER JOIN doctors d ON a.doctor_id = d.user_id
      INNER JOIN users u_doctor ON d.user_id = u_doctor.user_id
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
      LEFT JOIN chambers c ON a.chamber_id = c.chamber_id
      WHERE a.appointment_id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      hospital_id,
      chamber_id,
      appt_date,
      appt_time,
      status,
      note,
    } = req.body;

    const result = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, hospital_id, chamber_id, appt_date, appt_time, status, note) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        patient_id,
        doctor_id,
        hospital_id || null,
        chamber_id || null,
        appt_date,
        appt_time,
        status || "scheduled",
        note,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patient_id,
      doctor_id,
      hospital_id,
      chamber_id,
      appt_date,
      appt_time,
      status,
      note,
    } = req.body;

    const result = await db.query(
      `UPDATE appointments 
       SET patient_id = $1, doctor_id = $2, hospital_id = $3, chamber_id = $4, 
           appt_date = $5, appt_time = $6, status = $7, note = $8
       WHERE appointment_id = $9 RETURNING *`,
      [
        patient_id,
        doctor_id,
        hospital_id || null,
        chamber_id || null,
        appt_date,
        appt_time,
        status,
        note,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM appointments WHERE appointment_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await db.query(
      `
      SELECT 
        a.*,
        u_patient.full_name as patient_name,
        h.name as hospital_name,
        c.name as chamber_name
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.user_id
      INNER JOIN users u_patient ON p.user_id = u_patient.user_id
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
      LEFT JOIN chambers c ON a.chamber_id = c.chamber_id
      WHERE a.doctor_id = $1
      ORDER BY a.appt_date DESC, a.appt_time DESC
    `,
      [doctorId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { filter } = req.query; // today, upcoming, past

    let dateCondition = "";
    const today = new Date().toISOString().split("T")[0];

    if (filter === "today") {
      dateCondition = `AND a.appt_date = '${today}'`;
    } else if (filter === "upcoming") {
      dateCondition = `AND a.appt_date > '${today}'`;
    } else if (filter === "past") {
      dateCondition = `AND a.appt_date < '${today}'`;
    }

    const result = await db.query(
      `
      SELECT 
        a.*,
        u_doctor.full_name as doctor_name,
        d.consultation_fee,
        h.name as hospital_name,
        c.name as chamber_name,
        COALESCE(h.location, c.location) as location,
        t.symptoms, t.severity, t.notes as triage_notes
      FROM appointments a
      INNER JOIN doctors d ON a.doctor_id = d.user_id
      INNER JOIN users u_doctor ON d.user_id = u_doctor.user_id
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
      LEFT JOIN chambers c ON a.chamber_id = c.chamber_id
      LEFT JOIN triage_notes t ON a.appointment_id = t.appointment_id
      WHERE a.patient_id = $1 ${dateCondition}
      ORDER BY a.appt_date DESC, a.appt_time DESC
    `,
      [patientId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
