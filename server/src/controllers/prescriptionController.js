const db = require("../config/database");

exports.getAllPrescriptions = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, a.appt_date, a.appt_time,
        u_patient.full_name as patient_name,
        u_doctor.full_name as doctor_name
      FROM prescriptions p
      INNER JOIN appointments a ON p.appointment_id = a.appointment_id
      INNER JOIN patients pat ON a.patient_id = pat.user_id
      INNER JOIN users u_patient ON pat.user_id = u_patient.user_id
      INNER JOIN doctors d ON a.doctor_id = d.user_id
      INNER JOIN users u_doctor ON d.user_id = u_doctor.user_id
      ORDER BY p.prescription_id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "SELECT * FROM prescriptions WHERE prescription_id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await db.query(
      `SELECT p.*, a.appt_date, 
        u_doctor.full_name as doctor_name
      FROM prescriptions p
      INNER JOIN appointments a ON p.appointment_id = a.appointment_id
      INNER JOIN doctors d ON a.doctor_id = d.user_id
      INNER JOIN users u_doctor ON d.user_id = u_doctor.user_id
      WHERE a.patient_id = $1
      ORDER BY a.appt_date DESC`,
      [patientId]
    );

    // Calculate status (Ongoing/Past) and time left
    const prescriptions = result.rows.map(p => {
      const startDate = new Date(p.appt_date);
      const durationDays = p.duration_days || 0;
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);
      
      const today = new Date();
      // Reset time parts for accurate day comparison
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      const isOngoing = today <= endDate;
      const daysLeft = isOngoing 
        ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) 
        : 0;

      return {
        ...p,
        status: isOngoing ? 'ongoing' : 'past',
        days_left: daysLeft,
        end_date: endDate.toISOString().split('T')[0]
      };
    });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPrescriptionsByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const result = await db.query(
      "SELECT * FROM prescriptions WHERE appointment_id = $1",
      [appointmentId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPrescription = async (req, res) => {
  try {
    const {
      appointment_id,
      medicine_name,
      dosage,
      instructions,
      duration_days,
    } = req.body;

    const result = await db.query(
      `INSERT INTO prescriptions (appointment_id, medicine_name, dosage, instructions, duration_days) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [appointment_id, medicine_name, dosage, instructions, duration_days],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      appointment_id,
      medicine_name,
      dosage,
      instructions,
      duration_days,
    } = req.body;

    const result = await db.query(
      `UPDATE prescriptions 
       SET appointment_id = $1, medicine_name = $2, dosage = $3, instructions = $4, duration_days = $5
       WHERE prescription_id = $6 RETURNING *`,
      [appointment_id, medicine_name, dosage, instructions, duration_days, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM prescriptions WHERE prescription_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    res.json({ message: "Prescription deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
