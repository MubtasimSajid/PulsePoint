const db = require("../config/database");

// Get doctor's schedule
exports.getDoctorSchedules = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const result = await db.query(
      `
      SELECT 
        ds.*,
        CASE 
          WHEN ds.facility_type = 'hospital' THEN h.name
          ELSE c.name
        END as facility_name,
        CASE 
          WHEN ds.facility_type = 'hospital' THEN h.location
          ELSE c.location
        END as location
      FROM doctor_schedules ds
      LEFT JOIN hospitals h ON ds.facility_id = h.hospital_id AND ds.facility_type = 'hospital'
      LEFT JOIN chambers c ON ds.facility_id = c.chamber_id AND ds.facility_type = 'chamber'
      WHERE ds.doctor_id = $1 AND ds.is_active = TRUE
      ORDER BY 
        CASE ds.day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END,
        ds.start_time
    `,
      [doctorId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create doctor schedule
exports.createDoctorSchedule = async (req, res) => {
  try {
    const {
      doctor_id,
      facility_id,
      facility_type,
      day_of_week,
      start_time,
      end_time,
      slot_duration_minutes,
    } = req.body;

    const result = await db.query(
      `
      INSERT INTO doctor_schedules (doctor_id, facility_id, facility_type, day_of_week, start_time, end_time, slot_duration_minutes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        doctor_id,
        facility_id,
        facility_type,
        day_of_week,
        start_time,
        end_time,
        slot_duration_minutes || 30,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get available slots for a doctor
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { start_date, end_date, facility_type } = req.query;

    let query = `
      SELECT 
        s.*,
        CASE 
          WHEN s.facility_type = 'hospital' THEN h.name
          ELSE c.name
        END as facility_name
      FROM appointment_slots s
      LEFT JOIN hospitals h ON s.facility_id = h.hospital_id AND s.facility_type = 'hospital'
      LEFT JOIN chambers c ON s.facility_id = c.chamber_id AND s.facility_type = 'chamber'
      WHERE s.doctor_id = $1
        AND s.slot_date >= $2
        AND s.slot_date <= $3
    `;

    const params = [doctorId, start_date, end_date];

    if (facility_type) {
      query += ` AND s.facility_type = $4`;
      params.push(facility_type);
    }

    query += ` ORDER BY s.slot_date, s.slot_time`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate slots for a schedule
exports.generateSlots = async (req, res) => {
  try {
    const { schedule_id, start_date, end_date } = req.body;

    await db.query(`SELECT generate_slots_for_schedule($1, $2, $3)`, [
      schedule_id,
      start_date,
      end_date,
    ]);

    res.json({ message: "Slots generated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Book a slot
exports.bookSlot = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { slot_id, patient_id, doctor_id, triage_notes, payment_method } = req.body;

    // Check if slot is still free
    const slotCheck = await client.query(
      `SELECT s.*, 
              CASE WHEN s.facility_type = 'hospital' THEN h.name ELSE c.name END as facility_name
       FROM appointment_slots s
       LEFT JOIN hospitals h ON s.facility_id = h.hospital_id AND s.facility_type = 'hospital'
       LEFT JOIN chambers c ON s.facility_id = c.chamber_id AND s.facility_type = 'chamber'
       WHERE s.slot_id = $1 AND s.status = 'free' FOR UPDATE`,
      [slot_id],
    );

    if (slotCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Slot is no longer available" });
    }

    const slot = slotCheck.rows[0];

    // Get Doctor Fee
    const doctorCheck = await client.query(
      "SELECT consultation_fee, full_name, email FROM doctors d JOIN users u ON d.user_id = u.user_id WHERE d.user_id = $1",
      [doctor_id]
    );
    const doctor = doctorCheck.rows[0];
    const fee = doctor.consultation_fee || 0;

    // Process Payment
    if (payment_method === "wallet" && fee > 0) {
      try {
        const { processTransfer } = require("./paymentController");
        await processTransfer(
          patient_id, 
          doctor_id, 
          fee, 
          "appointment", 
          slot_id, // temporarily using slot_id as ref, will update to appt_id later or ignore
          client
        );
      } catch (err) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Payment failed: " + err.message });
      }
    } else if (payment_method === "mfs") {
      // For MFS, we assume external gateway verification happened on frontend
      // In a real app, we'd verify the transaction ID here. 
      // For now, we simulate 'adding funds' then 'transferring' or just log it.
      // Let's assume MFS results in direct balance update (deposit + pay)
      // Implementation omitted for brevity, focusing on Wallet as requested "deduct deducted"
    }

    // Create appointment
    const appointmentResult = await client.query(
      `
      INSERT INTO appointments (patient_id, doctor_id, hospital_id, chamber_id, appt_date, appt_time, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
      RETURNING *
    `,
      [
        patient_id,
        doctor_id,
        slot.facility_type === "hospital" ? slot.facility_id : null,
        slot.facility_type === "chamber" ? slot.facility_id : null,
        slot.slot_date,
        slot.slot_time,
      ],
    );

    const appointment = appointmentResult.rows[0];

    // Update slot status
    await client.query(
      `UPDATE appointment_slots SET status = 'booked', appointment_id = $1 WHERE slot_id = $2`,
      [appointment.appointment_id, slot_id],
    );

    // Add triage notes if provided
    if (triage_notes && triage_notes.symptoms) {
      await client.query(
        `
        INSERT INTO triage_notes (appointment_id, patient_id, symptoms, severity, notes)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          appointment.appointment_id,
          patient_id,
          triage_notes.symptoms,
          triage_notes.severity || "low",
          triage_notes.notes || "",
        ],
      );
    }

    await client.query("COMMIT");

    // Email Notification (After Commit)
    try {
        const { sendAppointmentEmail } = require("../services/emailService");
        
        // Fetch patient details for email
        const patientRes = await db.query("SELECT full_name FROM users WHERE user_id = $1", [patient_id]);
        const patientName = patientRes.rows[0]?.full_name || "Patient";

        const subject = `New Appointment: ${slot.slot_date} at ${slot.slot_time}`;
        const text = `Hello Dr. ${doctor.full_name},
        
New appointment confirmed!
Patient: ${patientName}
Date: ${slot.slot_date}
Time: ${slot.slot_time}
Location: ${slot.facility_name || "Clinic"}
Fee: ${fee} BDT (${payment_method})

Please log in to your dashboard for more details.`;

        await sendAppointmentEmail({
            to: doctor.email,
            subject,
            text
        });
    } catch (e) {
        console.error("Email failed", e);
        // Don't fail the request if email fails
    }

    res.status(201).json(appointment);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Block/unblock a slot
exports.updateSlotStatus = async (req, res) => {
  try {
    const { slot_id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      `UPDATE appointment_slots SET status = $1 WHERE slot_id = $2 RETURNING *`,
      [status, slot_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Slot not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
