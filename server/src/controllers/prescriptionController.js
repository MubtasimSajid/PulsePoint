const pool = require("../config/database");

exports.createPrescription = async (req, res) => {
  const client = await pool.connect();
  try {
    const { appointment_id, medications, notes } = req.body;
    // doctor_id comes from authenticated user.
    // patient_id must be verified from appointment.
    const doctor_id = req.user.userId;

    if (!appointment_id || !medications || medications.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await client.query("BEGIN");

    // 1. Fetch appointment details to validate doctor and time window
    const apptRes = await client.query(
      `SELECT * FROM appointments WHERE appointment_id = $1`,
      [appointment_id]
    );

    if (apptRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Appointment not found" });
    }

    const appt = apptRes.rows[0];

    // Verify doctor owns this appointment
    if (appt.doctor_id !== doctor_id) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Unauthorized access to this appointment" });
    }

    // 2. Validate Time Window
    // Appointment start time: appt.appt_date + appt.appt_time
    // Fix date formatting (avoid toISOString UTC shift)
    const d = new Date(appt.appt_date);
    const dateStr = [
      d.getFullYear(),
      ('0' + (d.getMonth() + 1)).slice(-2),
      ('0' + d.getDate()).slice(-2)
    ].join('-');
    
    // appt.appt_time is HH:MM:SS string
    const apptDateTimeStr = `${dateStr}T${appt.appt_time}`;
    const startDateTime = new Date(apptDateTimeStr);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    const now = new Date();

    // Check if NOW is between start and end
    if (now < startDateTime) {
      // Too early? Maybe allow? But requirement says "from start... upto 2 hours".
      // Let's stick to strict requirement.
      await client.query("ROLLBACK");
      return res.status(403).json({ 
        error: "Prescription can only be created after appointment start time." 
      });
    }

    if (now > endDateTime) {
      await client.query("ROLLBACK");
      return res.status(403).json({ 
        error: "Prescription time window expired (2 hours limit)." 
      });
    }

    // 3. Create Prescription
    const presResult = await client.query(
      `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING prescription_id`,
      [appointment_id, doctor_id, appt.patient_id, notes || ""]
    );
    const prescription_id = presResult.rows[0].prescription_id;

    // 4. Add Medications
    for (const med of medications) {
      await client.query(
        `INSERT INTO prescription_medications (prescription_id, medicine_name, dosage, duration)
         VALUES ($1, $2, $3, $4)`,
        [prescription_id, med.medicine_name, med.dosage, med.duration]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({ 
      message: "Prescription created successfully",
      prescription_id 
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create Prescription Error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

exports.getPrescriptionByAppointment = async (req, res) => {
  try {
    const { appointment_id } = req.params;
    const client = await pool.connect();
    
    const presRes = await client.query(
      `SELECT * FROM prescriptions WHERE appointment_id = $1`,
      [appointment_id]
    );

    if (presRes.rows.length === 0) {
      client.release();
      return res.json({ exists: false });
    }

    const prescription = presRes.rows[0];
    const medRes = await client.query(
      `SELECT * FROM prescription_medications WHERE prescription_id = $1`,
      [prescription.prescription_id]
    );

    client.release();
    res.json({ 
      exists: true, 
      ...prescription, 
      medications: medRes.rows 
    });

  } catch (error) {
    console.error("Get Prescription Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const client = await pool.connect();
    
    // Fetch prescriptions with doctor details
    const presRes = await client.query(
      `SELECT p.prescription_id, p.appointment_id, p.doctor_id, p.notes, p.created_at,
              u.full_name as doctor_name
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.user_id
       JOIN users u ON d.user_id = u.user_id
       WHERE p.patient_id = $1
       ORDER BY p.created_at DESC`,
      [patientId]
    );

    const prescriptions = presRes.rows;

    // Fetch medications for each prescription
    for (let i = 0; i < prescriptions.length; i++) {
        const medRes = await client.query(
            `SELECT * FROM prescription_medications WHERE prescription_id = $1`,
            [prescriptions[i].prescription_id]
        );
        prescriptions[i].medications = medRes.rows;
        
        // Flatten structure for UI (PatientPrescriptions.jsx expects flat list of meds sometimes, 
        // but it iterates prescriptions. Let's look at the UI code again.
        // It maps prescriptions: p.medicine_name... wait. 
        // The UI assumes each ITEM is a medicine? 
        // "ongoing.map((p) => ... p.medicine_name" 
        // Yes, the UI treats the response as a list of MEDICATIONS, not prescriptions.
    }
    
    // UI expects list of MEDICINES with metadata.
    // Let's flatten it.
    const flattened = [];
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    
    for (const p of prescriptions) {
        const diff = new Date() - new Date(p.created_at);
        const status = diff < oneMonth ? "ongoing" : "past";
        const days_left = Math.max(0, 30 - Math.floor(diff / (24 * 60 * 60 * 1000)));
        const end_date = new Date(new Date(p.created_at).getTime() + oneMonth).toLocaleDateString();

        for (const med of p.medications) {
            flattened.push({
                prescription_id: p.prescription_id, // non-unique if multiple meds per rx
                medicine_name: med.medicine_name,
                dosage: med.dosage,
                instructions: med.duration, // mapping duration to instructions/duration
                status: status,
                days_left: days_left,
                doctor_name: p.doctor_name,
                end_date: end_date
            });
        }
    }

    client.release();
    res.json(flattened);
  } catch (error) {
    console.error("Get Patient Prescriptions Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
