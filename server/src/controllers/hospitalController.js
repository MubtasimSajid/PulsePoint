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
      "SELECT COUNT(*)::int AS branch_count, MIN(name) AS hospital_name FROM hospitals WHERE admin_user_id = $1",
      [userId],
    );

    const branchCount = branchesResult.rows[0]?.branch_count ?? 0;
    const hospitalName = branchesResult.rows[0]?.hospital_name ?? null;

    const doctorsResult = await db.query(
      `SELECT COUNT(DISTINCT hd.doctor_id)::int AS doctor_count
       FROM hospital_doctors hd
       JOIN hospitals h ON h.hospital_id = hd.hospital_id
       WHERE h.admin_user_id = $1`,
      [userId],
    );

    const patientsResult = await db.query(
      `SELECT COUNT(DISTINCT a.patient_id)::int AS patient_count
       FROM appointments a
       JOIN hospitals h ON h.hospital_id = a.hospital_id
       WHERE h.admin_user_id = $1`,
      [userId],
    );

    res.json({
      hospital_name: hospitalName,
      branch_count: branchCount,
      doctor_count: doctorsResult.rows[0]?.doctor_count ?? 0,
      patient_count: patientsResult.rows[0]?.patient_count ?? 0,
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
