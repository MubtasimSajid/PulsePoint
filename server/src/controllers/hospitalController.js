const db = require("../config/database");

exports.getMyHospitalStats = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (role !== "hospital_admin" && role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const branchesResult = await db.query(
      "SELECT SUM(COALESCE(array_length(branch_names, 1), 1))::int AS branch_count, MIN(name) AS hospital_name FROM hospitals WHERE admin_user_id = $1",
      [userId],
    );

    const branchCount = branchesResult.rows[0]?.branch_count ?? 0;
    const hospitalName = branchesResult.rows[0]?.hospital_name ?? null;

    const doctorsResult = await db.query(
      `SELECT COUNT(DISTINCT doctor_id)::int AS doctor_count
       FROM (
         -- Doctors explicitly added to the hospital
         SELECT hd.doctor_id
         FROM hospital_doctors hd
         JOIN hospitals h ON h.hospital_id = hd.hospital_id
         WHERE h.admin_user_id = $1

         UNION

         -- Doctors who have assigned availability (schedules) at a hospital branch
         SELECT ds.doctor_id
         FROM doctor_schedules ds
         JOIN hospitals h ON h.hospital_id = ds.facility_id
         WHERE ds.facility_type = 'hospital'
           AND ds.is_active = TRUE
           AND h.admin_user_id = $1
       ) doctors`,
      [userId],
    );

    const patientsResult = await db.query(
      `SELECT COUNT(DISTINCT a.patient_id)::int AS patient_count
       FROM appointments a
       JOIN hospitals h ON h.hospital_id = a.hospital_id
       WHERE h.admin_user_id = $1
         AND a.hospital_id IS NOT NULL
         AND a.status <> 'cancelled'`,
      [userId],
    );

    const canonicalHospitalRes = await db.query(
      "SELECT MIN(hospital_id)::int AS hospital_id FROM hospitals WHERE admin_user_id = $1",
      [userId],
    );
    const canonicalHospitalId =
      canonicalHospitalRes.rows[0]?.hospital_id ?? null;

    const balanceResult = canonicalHospitalId
      ? await db.query(
        `SELECT COALESCE(balance, 0) as total_balance
           FROM accounts
           WHERE owner_type = 'hospital' AND owner_id = $1`,
        [canonicalHospitalId],
      )
      : { rows: [{ total_balance: 0 }] };

    res.json({
      hospital_name: hospitalName,
      branch_count: branchCount,
      doctor_count: doctorsResult.rows[0]?.doctor_count ?? 0,
      patient_count: patientsResult.rows[0]?.patient_count ?? 0,
      total_balance: balanceResult.rows[0]?.total_balance ?? 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllHospitals = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT h.*, u.full_name as admin_name
      FROM hospitals h
      INNER JOIN users u ON h.admin_user_id = u.user_id
      ORDER BY h.hospital_id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `
      SELECT h.*, u.full_name as admin_name
      FROM hospitals h
      INNER JOIN users u ON h.admin_user_id = u.user_id
      WHERE h.hospital_id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createHospital = async (req, res) => {
  try {
    const {
      admin_user_id,
      name,
      est_year,
      email,
      phone,
      address,
      license_number,
    } = req.body;

    const result = await db.query(
      `INSERT INTO hospitals (admin_user_id, name, est_year, email, phone, address, license_number) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [admin_user_id, name, est_year, email, phone, address, license_number],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      admin_user_id,
      name,
      est_year,
      email,
      phone,
      address,
      license_number,
    } = req.body;

    const result = await db.query(
      `UPDATE hospitals 
       SET admin_user_id = $1, name = $2, est_year = $3, email = $4, phone = $5, address = $6, license_number = $7
       WHERE hospital_id = $8 RETURNING *`,
      [
        admin_user_id,
        name,
        est_year,
        email,
        phone,
        address,
        license_number,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM hospitals WHERE hospital_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    res.json({ message: "Hospital deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHospitalDoctors = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `
      SELECT u.*, d.doctor_code, hd.consultation_fee
      FROM hospital_doctors hd
      INNER JOIN doctors d ON hd.doctor_id = d.user_id
      INNER JOIN users u ON d.user_id = u.user_id
      WHERE hd.hospital_id = $1
    `,
      [id],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyRecentActivity = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (role !== "hospital_admin" && role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const limitRaw = Number(req.query?.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(25, Math.floor(limitRaw)))
      : 10;

    const result = await db.query(
      `SELECT 
         a.appointment_id,
         a.appt_date,
         a.appt_time,
         a.status,
         h.name as hospital_name,
         u_doctor.full_name as doctor_name,
         u_patient.full_name as patient_name
       FROM appointments a
       JOIN hospitals h ON h.hospital_id = a.hospital_id
       JOIN users u_doctor ON u_doctor.user_id = a.doctor_id
       JOIN users u_patient ON u_patient.user_id = a.patient_id
       WHERE h.admin_user_id = $1
       ORDER BY a.appointment_id DESC
       LIMIT $2`,
      [userId, limit],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get doctors for the logged-in hospital admin
exports.getMyDoctors = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (role !== "hospital_admin" && role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await db.query(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.phone,
         d.doctor_code,
         d.specializations,
         d.experience_years,
         hd.consultation_fee,
         hd.hospital_id,
         h.name as hospital_name
       FROM hospital_doctors hd
       JOIN hospitals h ON h.hospital_id = hd.hospital_id
       JOIN doctors d ON d.user_id = hd.doctor_id
       JOIN users u ON u.user_id = d.user_id
       WHERE h.admin_user_id = $1
       ORDER BY u.full_name`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a doctor to hospital
exports.addDoctorToHospital = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (role !== "hospital_admin" && role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { doctor_id, consultation_fee } = req.body;

    if (!doctor_id) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    // Get the hospital for this admin
    const hospitalRes = await db.query(
      "SELECT hospital_id FROM hospitals WHERE admin_user_id = $1 LIMIT 1",
      [userId],
    );

    if (hospitalRes.rows.length === 0) {
      return res.status(404).json({ error: "No hospital found for this admin" });
    }

    const hospitalId = hospitalRes.rows[0].hospital_id;

    // Check if doctor already exists in this hospital
    const existingRes = await db.query(
      "SELECT * FROM hospital_doctors WHERE hospital_id = $1 AND doctor_id = $2",
      [hospitalId, doctor_id],
    );

    if (existingRes.rows.length > 0) {
      return res.status(400).json({ error: "Doctor already added to this hospital" });
    }

    // Add doctor to hospital
    const result = await db.query(
      `INSERT INTO hospital_doctors (hospital_id, doctor_id, consultation_fee)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [hospitalId, doctor_id, consultation_fee || 500],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove a doctor from hospital
exports.removeDoctorFromHospital = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (role !== "hospital_admin" && role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { doctorId } = req.params;

    // Get the hospital for this admin
    const hospitalRes = await db.query(
      "SELECT hospital_id FROM hospitals WHERE admin_user_id = $1 LIMIT 1",
      [userId],
    );

    if (hospitalRes.rows.length === 0) {
      return res.status(404).json({ error: "No hospital found for this admin" });
    }

    const hospitalId = hospitalRes.rows[0].hospital_id;

    const result = await db.query(
      "DELETE FROM hospital_doctors WHERE hospital_id = $1 AND doctor_id = $2 RETURNING *",
      [hospitalId, doctorId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Doctor not found in this hospital" });
    }

    res.json({ message: "Doctor removed from hospital successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a doctor's consultation fee
exports.updateDoctorFee = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (role !== "hospital_admin" && role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { doctorId } = req.params;
    const { consultation_fee } = req.body;

    if (consultation_fee === undefined) {
      return res.status(400).json({ error: "Consultation fee is required" });
    }

    // Get the hospital for this admin
    const hospitalRes = await db.query(
      "SELECT hospital_id FROM hospitals WHERE admin_user_id = $1 LIMIT 1",
      [userId],
    );

    if (hospitalRes.rows.length === 0) {
      return res.status(404).json({ error: "No hospital found for this admin" });
    }

    const hospitalId = hospitalRes.rows[0].hospital_id;

    const result = await db.query(
      `UPDATE hospital_doctors 
       SET consultation_fee = $1
       WHERE hospital_id = $2 AND doctor_id = $3
       RETURNING *`,
      [consultation_fee, hospitalId, doctorId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Doctor not found in this hospital" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
