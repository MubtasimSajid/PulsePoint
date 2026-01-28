const db = require("../config/database");
const { sendAppointmentEmail } = require("../services/emailService");

exports.getAllAppointments = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        a.*,
        dept.name as department_name,
        u_patient.full_name as patient_name,
        u_doctor.full_name as doctor_name,
        u_doctor.email as doctor_email,
        h.name as hospital_name,
        h.address as hospital_address,
        c.name as chamber_name,
        c.address as chamber_address,
        COALESCE(h.address, c.address) as facility_address
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.user_id
      INNER JOIN users u_patient ON p.user_id = u_patient.user_id
      INNER JOIN doctors d ON a.doctor_id = d.user_id
      INNER JOIN users u_doctor ON d.user_id = u_doctor.user_id
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
      LEFT JOIN chambers c ON a.chamber_id = c.chamber_id
      LEFT JOIN departments dept ON a.department_id = dept.dept_id
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
    const appointment = await fetchAppointmentDetails(id);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    function formatFriendlyDate(value) {
      if (!value) return "";

      // Prefer YYYY-MM-DD if present to avoid timezone shifts.
      const raw = String(value);
      const isoPrefix = raw.match(/^\d{4}-\d{2}-\d{2}/);
      let dateObj;
      if (isoPrefix) {
        const [y, m, d] = isoPrefix[0].split("-").map((n) => parseInt(n, 10));
        dateObj = new Date(y, m - 1, d);
      } else if (value instanceof Date) {
        dateObj = value;
      } else {
        const parsed = new Date(raw);
        dateObj = Number.isNaN(parsed.getTime()) ? null : parsed;
      }

      if (!dateObj) return raw;

      const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        dateObj.getDay()
      ];
      const month = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][dateObj.getMonth()];
      const day = String(dateObj.getDate()).padStart(2, "0");
      const year = dateObj.getFullYear();
      return `${weekday}, ${day} ${month} ${year}`;
    }

    function formatTimeOnly(value) {
      if (!value) return "";
      const str = String(value);
      const match = str.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return str;
      return `${match[1].padStart(2, "0")}:${match[2]}`;
    }

    const {
      patient_id,
      doctor_id,
      hospital_id,
      chamber_id,
      department_id,
      appt_date,
      appt_time,
      status,
      note,
    } = req.body;

    if (!patient_id || !doctor_id || !appt_date || !appt_time) {
      return res.status(400).json({
        error: "patient_id, doctor_id, appt_date, and appt_time are required",
      });
    }

    if (hospital_id && chamber_id) {
      return res
        .status(400)
        .json({ error: "Choose either hospital_id or chamber_id, not both" });
    }

    if (!hospital_id && !chamber_id) {
      return res
        .status(400)
        .json({ error: "hospital_id or chamber_id is required" });
    }

    if (!department_id) {
      return res
        .status(400)
        .json({ error: "department_id is required for appointments" });
    }

    const result = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, hospital_id, chamber_id, department_id, appt_date, appt_time, status, note) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        patient_id,
        doctor_id,
        hospital_id || null,
        chamber_id || null,
        department_id,
        appt_date,
        appt_time,
        status || "scheduled",
        note,
      ],
    );

    const appointmentId = result.rows[0].appointment_id;
    const details = await fetchAppointmentDetails(appointmentId);

    if (details?.doctor_email) {
      try {
        const apptDate = formatFriendlyDate(details.appt_date);
        const apptTime = formatTimeOnly(details.appt_time);

        const subject = `New appointment on ${apptDate} at ${apptTime}`;
        const locationLabel =
          details.hospital_name || details.chamber_name || "Clinic";
        const text = `Hello ${details.doctor_name || "Doctor"},

${details.patient_name} has scheduled an appointment.
      When: ${apptDate} at ${apptTime}
Department: ${details.department_name || "General"}
Location: ${locationLabel}
Address: ${details.facility_address || "N/A"}

Notes: ${details.note || "None"}`;

        await sendAppointmentEmail({
          to: details.doctor_email,
          subject,
          text,
        });
      } catch (emailError) {
        console.error("Failed to send appointment email", emailError);
      }
    }

    res.status(201).json(details || result.rows[0]);
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
      department_id,
      appt_date,
      appt_time,
      status,
      note,
    } = req.body;

    if (hospital_id && chamber_id) {
      return res
        .status(400)
        .json({ error: "Choose either hospital_id or chamber_id, not both" });
    }

    const result = await db.query(
      `UPDATE appointments 
       SET patient_id = COALESCE($1, patient_id),
           doctor_id = COALESCE($2, doctor_id),
           hospital_id = COALESCE($3, hospital_id),
           chamber_id = COALESCE($4, chamber_id),
           department_id = COALESCE($5, department_id),
           appt_date = COALESCE($6, appt_date),
           appt_time = COALESCE($7, appt_time),
           status = COALESCE($8, status),
           note = COALESCE($9, note)
       WHERE appointment_id = $10 RETURNING *`,
      [
        patient_id,
        doctor_id,
        hospital_id,
        chamber_id,
        department_id,
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

    const details = await fetchAppointmentDetails(
      result.rows[0].appointment_id,
    );

    res.json(details || result.rows[0]);
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

exports.cancelAppointment = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params; // appointment_id
    const { reason } = req.body;
    const requesterUserId = req.user?.userId;

    if (!requesterUserId) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Authentication required" });
    }

    // Lock the appointment row. Avoid FOR UPDATE on a nullable LEFT JOIN side (Postgres error).
    const apptCheck = await client.query(
      `SELECT a.*, d.consultation_fee, d.user_id as doctor_user_id
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.user_id
       WHERE a.appointment_id = $1
       FOR UPDATE OF a`,
      [id],
    );

    if (apptCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Appointment not found" });
    }

    const appt = apptCheck.rows[0];

    // If a slot exists for this appointment, lock it too (so freeing is race-safe).
    const slotRes = await client.query(
      `SELECT slot_id
       FROM appointment_slots
       WHERE appointment_id = $1
       FOR UPDATE`,
      [id],
    );
    if (slotRes.rows.length > 0) {
      appt.slot_id = slotRes.rows[0].slot_id;
    }

    // Only the assigned doctor can cancel
    if (appt.doctor_id !== requesterUserId) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "Only the assigned doctor can cancel this appointment",
      });
    }

    if (appt.status === "cancelled") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Appointment is already cancelled" });
    }

    // Refund based on the recorded payment transactions (if any)
    // The DB trigger creates two transactions: 'Doctor fee' and optionally 'Hospital fee (10%)'
    const paymentTxRes = await client.query(
      `SELECT 
         t.from_account_id, 
         t.to_account_id, 
         t.amount, 
         t.description,
         acc_to.owner_type as to_owner_type,
         acc_to.owner_id as to_owner_id
       FROM account_transactions t
       JOIN accounts acc_to ON t.to_account_id = acc_to.account_id
       WHERE t.status = 'completed'
         AND (t.description LIKE ('Doctor fee for appointment ' || $1 || '%')
              OR t.description LIKE ('Hospital fee (10%) for appointment ' || $1 || '%'))
       ORDER BY t.created_at DESC`,
      [appt.appointment_id],
    );

    if (paymentTxRes.rows.length > 0) {
      const { processTransfer } = require("./paymentController");

      // Refund each payment transaction in reverse (doctor/hospital -> patient)
      for (const tx of paymentTxRes.rows) {
        const refundAmount = parseFloat(tx.amount);
        if (refundAmount > 0) {
          try {
            // For hospital fees, we need to handle differently since processTransfer expects user IDs
            // and hospitals don't have user IDs. We'll need to create a direct transaction instead.
            if (tx.to_owner_type === "hospital") {
              // Direct refund from hospital account back to patient account
              await client.query(
                `INSERT INTO account_transactions
                 (from_account_id, to_account_id, amount, status, description)
                 VALUES ($1, $2, $3, 'completed', $4)`,
                [
                  tx.to_account_id, // hospital account
                  tx.from_account_id, // patient account
                  refundAmount,
                  `Refund: ${tx.description}`,
                ],
              );
            } else {
              // User-to-user refund (doctor -> patient)
              await processTransfer(
                tx.to_owner_id, // from doctor user ID
                appt.patient_id, // to patient user ID
                refundAmount,
                "appointment",
                appt.appointment_id,
                client,
                {
                  description: `Refund: ${tx.description}`,
                },
              );
            }
          } catch (err) {
            await client.query("ROLLBACK");
            return res
              .status(400)
              .json({ error: "Refund failed: " + err.message });
          }
        }
      }
    }

    // Update Appointment Status
    await client.query(
      "UPDATE appointments SET status = 'cancelled', note = COALESCE($2, note) WHERE appointment_id = $1",
      [id, reason || null],
    );

    // Free the Slot
    if (appt.slot_id) {
      await client.query(
        "UPDATE appointment_slots SET status = 'free', appointment_id = NULL WHERE slot_id = $1",
        [appt.slot_id],
      );
    }

    await client.query("COMMIT");

    // Email Patient
    // Implementation omitted for brevity, but should be here.

    res.json({ message: "Appointment cancelled" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await db.query(
      `
      SELECT 
        a.*,
        dept.name as department_name,
        u_patient.full_name as patient_name,
        h.name as hospital_name,
        h.address as hospital_address,
        c.name as chamber_name,
        c.address as chamber_address,
        COALESCE(h.address, c.address) as facility_address
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.user_id
      INNER JOIN users u_patient ON p.user_id = u_patient.user_id
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
      LEFT JOIN chambers c ON a.chamber_id = c.chamber_id
      LEFT JOIN departments dept ON a.department_id = dept.dept_id
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
        dept.name as department_name,
        u_doctor.full_name as doctor_name,
        d.consultation_fee,
        h.name as hospital_name,
        h.address as hospital_address,
        c.name as chamber_name,
        c.address as chamber_address,
        COALESCE(h.location, c.location) as location,
        COALESCE(h.address, c.address) as facility_address,
        t.symptoms, t.severity, t.notes as triage_notes
      FROM appointments a
      INNER JOIN doctors d ON a.doctor_id = d.user_id
      INNER JOIN users u_doctor ON d.user_id = u_doctor.user_id
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
      LEFT JOIN chambers c ON a.chamber_id = c.chamber_id
      LEFT JOIN departments dept ON a.department_id = dept.dept_id
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

async function fetchAppointmentDetails(appointmentId) {
  const result = await db.query(
    `
    SELECT 
      a.*,
      dept.name as department_name,
      u_patient.full_name as patient_name,
      u_patient.email as patient_email,
      u_doctor.full_name as doctor_name,
      u_doctor.email as doctor_email,
      h.name as hospital_name,
      h.address as hospital_address,
      c.name as chamber_name,
      c.address as chamber_address,
      COALESCE(h.address, c.address) as facility_address
    FROM appointments a
    INNER JOIN patients p ON a.patient_id = p.user_id
    INNER JOIN users u_patient ON p.user_id = u_patient.user_id
    INNER JOIN doctors d ON a.doctor_id = d.user_id
    INNER JOIN users u_doctor ON d.user_id = u_doctor.user_id
    LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
    LEFT JOIN chambers c ON a.chamber_id = c.chamber_id
    LEFT JOIN departments dept ON a.department_id = dept.dept_id
    WHERE a.appointment_id = $1
  `,
    [appointmentId],
  );

  return result.rows[0];
}
